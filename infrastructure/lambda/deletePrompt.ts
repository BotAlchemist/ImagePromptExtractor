import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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

  // The partition key (userId) already scopes the delete to the authenticated user.
  // DynamoDB will silently succeed (no-op) if the item does not exist.
  await ddb.send(
    new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { userId, promptId },
    }),
  );

  return { statusCode: 204, body: '' };
};
