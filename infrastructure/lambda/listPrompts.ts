import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  const userId = event.requestContext.authorizer.jwt.claims['sub'] as string;
  const qs = event.queryStringParameters ?? {};

  const rawLimit = parseInt(qs['limit'] ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit), MAX_LIMIT);

  let exclusiveStartKey: Record<string, unknown> | undefined;
  if (qs['cursor']) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(qs['cursor'], 'base64url').toString('utf-8'));
    } catch {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Invalid cursor' }),
      };
    }
  }

  const result = await ddb.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: 'dateIndex',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Limit: limit,
      ScanIndexForward: false, // newest first
      ExclusiveStartKey: exclusiveStartKey,
    }),
  );

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey), 'utf-8').toString('base64url')
    : null;

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({
      items: result.Items ?? [],
      nextCursor,
      count: result.Count ?? 0,
    }),
  };
};
