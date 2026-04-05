import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // ── DynamoDB Table ────────────────────────────────────────────────────────
    const table = new dynamodb.Table(this, 'PromptLibrary', {
      tableName: 'PromptLibrary',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'promptId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // Retain on stack deletion to prevent accidental data loss
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for date-sorted listing (newest first via ScanIndexForward: false)
    table.addGlobalSecondaryIndex({
      indexName: 'dateIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'savedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for filtering by category
    table.addGlobalSecondaryIndex({
      indexName: 'categoryIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'primaryCategory', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── Shared Lambda config ──────────────────────────────────────────────────
    const commonProps: Partial<lambdaNode.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        // AWS SDK v3 is included in the Lambda Node.js 20.x runtime
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
    };

    // ── Lambda: extractPrompt ─────────────────────────────────────────────────
    const extractFn = new lambdaNode.NodejsFunction(this, 'ExtractPrompt', {
      ...commonProps,
      entry: path.join(__dirname, '../lambda/extractPrompt.ts'),
      functionName: 'midjourney-extract-prompt',
      description: 'Calls Bedrock Claude to extract prompt categories',
      timeout: cdk.Duration.seconds(30),
      environment: {
        BEDROCK_MODEL_ID: 'amazon.nova-pro-v1:0',
      },
    });

    // Allow invoking the foundation model
    extractFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0`,
        ],
      }),
    );

    // ── Lambda: savePrompt ────────────────────────────────────────────────────
    const saveFn = new lambdaNode.NodejsFunction(this, 'SavePrompt', {
      ...commonProps,
      entry: path.join(__dirname, '../lambda/savePrompt.ts'),
      functionName: 'midjourney-save-prompt',
      description: 'Saves an extracted prompt to the library',
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantWriteData(saveFn);

    // ── Lambda: listPrompts ───────────────────────────────────────────────────
    const listFn = new lambdaNode.NodejsFunction(this, 'ListPrompts', {
      ...commonProps,
      entry: path.join(__dirname, '../lambda/listPrompts.ts'),
      functionName: 'midjourney-list-prompts',
      description: 'Lists prompts in the user library with pagination',
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadData(listFn);

    // ── Lambda: getPrompt ─────────────────────────────────────────────────────
    const getFn = new lambdaNode.NodejsFunction(this, 'GetPrompt', {
      ...commonProps,
      entry: path.join(__dirname, '../lambda/getPrompt.ts'),
      functionName: 'midjourney-get-prompt',
      description: 'Gets a single saved prompt by ID',
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadData(getFn);

    // ── Lambda: deletePrompt ──────────────────────────────────────────────────
    const deleteFn = new lambdaNode.NodejsFunction(this, 'DeletePrompt', {
      ...commonProps,
      entry: path.join(__dirname, '../lambda/deletePrompt.ts'),
      functionName: 'midjourney-delete-prompt',
      description: 'Deletes a saved prompt from the library',
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantWriteData(deleteFn);

    // ── API Gateway HTTP API ──────────────────────────────────────────────────
    // allowedOrigin defaults to * for initial deploy.
    // Tighten post-deploy: cdk deploy --context allowedOrigin=https://main.xxx.amplifyapp.com
    const allowedOrigin = this.node.tryGetContext('allowedOrigin') ?? '*';

    const api = new apigwv2.HttpApi(this, 'PromptExtractorApi', {
      apiName: 'midjourney-extractor-api',
      description: 'Midjourney Prompt Extractor API',
      corsPreflight: {
        allowOrigins: [allowedOrigin],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Cognito JWT authorizer — validates Bearer token on every request
    const authorizer = new authorizers.HttpUserPoolAuthorizer(
      'CognitoAuthorizer',
      props.userPool,
      {
        userPoolClients: [props.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      },
    );

    // ── Routes ────────────────────────────────────────────────────────────────
    api.addRoutes({
      path: '/extract',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('ExtractIntegration', extractFn),
      authorizer,
    });

    api.addRoutes({
      path: '/prompts',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('SaveIntegration', saveFn),
      authorizer,
    });

    api.addRoutes({
      path: '/prompts',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('ListIntegration', listFn),
      authorizer,
    });

    api.addRoutes({
      path: '/prompts/{promptId}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('GetIntegration', getFn),
      authorizer,
    });

    api.addRoutes({
      path: '/prompts/{promptId}',
      methods: [apigwv2.HttpMethod.DELETE],
      integration: new integrations.HttpLambdaIntegration('DeleteIntegration', deleteFn),
      authorizer,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiEndpoint,
      description: 'Set as VITE_API_URL in Amplify Console environment variables',
    });
  }
}
