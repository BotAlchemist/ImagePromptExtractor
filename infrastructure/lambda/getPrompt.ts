import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  const userId = event.requestContext.authorizer.jwt.claims['sub'] as string;
  const promptId = decodeURIComponent(event.pathParameters?.['promptId'] ?? '');

  if (!promptId) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'promptId is required' }) };
  }

  const result = await ddb.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { userId, promptId },
    }),
  );

  if (!result.Item) {
    return { statusCode: 404, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Prompt not found' }) };
  }

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify(result.Item),
  };
};
