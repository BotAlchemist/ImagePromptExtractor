import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

const SYSTEM_PROMPT = `You are an expert AI image generation prompt analyst.
Given a raw generation prompt, extract and categorize every element into the following JSON schema.
If a field is not present in the prompt, return an empty string "" for string fields and an empty array [] for array fields.
Return ONLY valid JSON — no markdown code blocks, no explanation, no additional text before or after the JSON.

{
  "subject": "",
  "style": "",
  "lighting": "",
  "cameraAngle": "",
  "lensSettings": "",
  "colorPalette": "",
  "mood": "",
  "environment": "",
  "artistReferences": [],
  "qualityModifiers": [],
  "negativePrompts": "",
  "otherElements": ""
}`;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  let rawPrompt: string;

  try {
    const body = JSON.parse(event.body ?? '{}');
    rawPrompt = (body.prompt ?? '').trim();
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!rawPrompt) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: '"prompt" field is required' }),
    };
  }

  const modelId = process.env.BEDROCK_MODEL_ID ?? 'amazon.nova-pro-v1:0';

  const payload = {
    system: [{ text: SYSTEM_PROMPT }],
    messages: [
      {
        role: 'user',
        content: [{ text: `Analyze this image generation prompt and extract its elements:\n\n${rawPrompt}` }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0,
    },
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await bedrock.send(command);
  const responseText = new TextDecoder().decode(response.body);
  const modelResponse = JSON.parse(responseText);

  // Nova Pro response: output.message.content[0].text
  const extractedText: string = modelResponse?.output?.message?.content?.[0]?.text ?? '';

  let categories: unknown;
  try {
    // Strip any accidental markdown code fences Claude might include
    const cleaned = extractedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    categories = JSON.parse(cleaned);
  } catch {
    return {
      statusCode: 502,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Model returned non-JSON response', raw: extractedText }),
    };
  }

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify(categories),
  };
};
