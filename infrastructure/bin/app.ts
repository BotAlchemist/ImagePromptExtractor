#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const cognitoStack = new CognitoStack(app, 'MidjourneyExtractorCognito', { env });

new ApiStack(app, 'MidjourneyExtractorApi', {
  env,
  userPool: cognitoStack.userPool,
  userPoolClient: cognitoStack.userPoolClient,
});
