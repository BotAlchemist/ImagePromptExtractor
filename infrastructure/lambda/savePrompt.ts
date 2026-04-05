import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  const userId = event.requestContext.authorizer.jwt.claims['sub'] as string;

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { rawPrompt, title, categories, tags, notes } = body;

  if (!rawPrompt || !title || !categories) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: '"rawPrompt", "title", and "categories" are required' }),
    };
  }

  const promptId = randomUUID();
  const savedAt = new Date().toISOString();

  const item = {
    userId,
    promptId,
    rawPrompt,
    title,
    categories,
    tags: Array.isArray(tags) ? tags : [],
    notes: typeof notes === 'string' ? notes : '',
    savedAt,
  };

  await ddb.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
    }),
  );

  return {
    statusCode: 201,
    headers: JSON_HEADERS,
    body: JSON.stringify(item),
  };
};
