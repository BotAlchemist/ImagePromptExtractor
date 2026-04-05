# Midjourney Prompt Extractor — Build Plan

## Overview

A React SPA deployed via AWS Amplify + Git. Users paste image-generation prompts, AWS Bedrock (Claude 3 Haiku) extracts them into structured categories, and users save/browse a personal prompt library stored in DynamoDB. All backend infrastructure is deployed via AWS CDK (TypeScript). Auth is handled by Amazon Cognito (email + phone sign-in).

---

## Architecture

```
React SPA
  └── AWS Amplify (Git-connected, auto-builds on push to main)
        └── CloudFront + S3 (managed by Amplify)

API Gateway HTTP API (us-east-1)
  └── Cognito JWT Authorizer (all routes protected)
        ├── POST /extract        → Lambda: extractPrompt  → Bedrock Claude 3 Haiku
        ├── POST /prompts        → Lambda: savePrompt     → DynamoDB
        ├── GET  /prompts        → Lambda: listPrompts    → DynamoDB
        ├── GET  /prompts/{id}   → Lambda: getPrompt      → DynamoDB
        └── DELETE /prompts/{id} → Lambda: deletePrompt   → DynamoDB

Auth: Amazon Cognito User Pool
  └── Email sign-in + Phone number sign-in (SMS OTP via SNS)
  └── Note: SNS SMS is sandboxed by default — exit sandbox before going to production

Database: DynamoDB table "PromptLibrary"
  └── PK: userId (Cognito sub)
  └── SK: promptId (UUID v4)
  └── GSI dateIndex: PK userId, SK savedAt (ISO timestamp) — used for sorted listing

IaC: AWS CDK TypeScript (infrastructure/ directory)
```

---

## DynamoDB Item Shape

```json
{
  "userId": "cognito-sub-uuid",
  "promptId": "uuid-v4",
  "rawPrompt": "Full original prompt text",
  "title": "User-assigned title",
  "categories": {
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
  },
  "tags": [],
  "savedAt": "2026-04-05T00:00:00.000Z",
  "notes": ""
}
```

---

## Bedrock Extraction Prompt Template

Stored as a constant in `infrastructure/lambda/extractPrompt.ts`. Sent as the `system` message to Claude 3 Haiku.

```
You are an expert AI image generation prompt analyst.
Given a raw generation prompt, extract and categorize every element into the following JSON schema.
If a field is not present in the prompt, return an empty string "" for string fields and [] for array fields.
Return ONLY valid JSON, no markdown code blocks, no explanation, no additional text.

{
  "subject": "",          // Main subject, character, or object
  "style": "",            // Art style, medium, movement
  "lighting": "",         // Lighting type, direction, quality
  "cameraAngle": "",      // Perspective/framing (e.g. bird's eye, close-up, wide shot)
  "lensSettings": "",     // mm, aperture, DOF, bokeh (e.g. "85mm f/1.4 shallow DOF")
  "colorPalette": "",     // Dominant colors or color scheme
  "mood": "",             // Emotional tone or atmosphere
  "environment": "",      // Setting, background, location
  "artistReferences": [], // Referenced artists, photographers, studios
  "qualityModifiers": [], // Tags like "4K", "photorealistic", "artstation"
  "negativePrompts": "",  // Content after --no or negative weight markers
  "otherElements": ""     // Any remaining elements not captured above
}
```

Model: `anthropic.claude-3-haiku-20240307-v1:0`
Max tokens: 1024
Region: `us-east-1`

---

## Project Structure

```
Midjourney_Extracter/
  amplify.yml                     ← Root Amplify build spec (points to frontend/)
  plan.md                         ← This file
  infrastructure/                 ← CDK project (Cognito + DynamoDB + Lambda + APIGW)
    bin/app.ts
    lib/
      cognito-stack.ts
      api-stack.ts
    lambda/
      extractPrompt.ts
      savePrompt.ts
      listPrompts.ts
      getPrompt.ts
      deletePrompt.ts
    cdk.json
    package.json
    tsconfig.json
  frontend/                       ← Vite + React + TypeScript
    src/
      pages/
        ExtractorPage.tsx         ← Paste prompt → extract → edit → save
        LibraryPage.tsx           ← Browse saved prompts with filters
      components/
        NavBar.tsx
        PromptInput.tsx
        CategoryCard.tsx
        CategoryGrid.tsx
        SavePromptModal.tsx
        PromptCard.tsx
        FilterBar.tsx
      hooks/
        useExtract.ts             ← POST /extract
        useLibrary.ts             ← CRUD /prompts
      lib/
        amplifyConfig.ts          ← Amplify.configure()
        apiClient.ts              ← Authenticated fetch wrapper
      config/
        categories.ts             ← Category label/order definitions
      types.ts
      App.tsx
      main.tsx
      index.css
    index.html
    package.json
    tsconfig.json
    tsconfig.node.json
    vite.config.ts
    tailwind.config.js
    postcss.config.js
    .env.local                    ← Local dev only, never committed
```

---

## CDK Stacks

### CognitoStack
- `UserPool`: email + phone sign-in, self sign-up enabled, email + phone auto-verification
- `UserPoolClient`: no secret (SPA-safe), SRP and USER_PASSWORD auth flows
- Outputs: `UserPoolId`, `UserPoolClientId`

### ApiStack (depends on CognitoStack)
- **DynamoDB** table `PromptLibrary` with PK `userId`, SK `promptId`, GSI `dateIndex`
- **5 Lambda functions** (Node.js 20.x, esbuild-bundled via NodejsFunction)
  - `extractPrompt`: `bedrock:InvokeModel` permission on Claude 3 Haiku ARN
  - `savePrompt`, `listPrompts`, `getPrompt`, `deletePrompt`: scoped DynamoDB permissions
- **API Gateway HTTP API** with:
  - `HttpUserPoolAuthorizer` (Cognito JWT validation on all routes)
  - CORS configured (allowedOrigin defaults to `*`, override via CDK context `--context allowedOrigin=https://...`)
- Output: `ApiUrl`

---

## Deployment Workflow

### First Deploy
1. `cd infrastructure && npm install`
2. `npx cdk bootstrap aws://ACCOUNT_ID/us-east-1` (first time only)
3. `npx cdk deploy --all`
4. Note the stack outputs: `UserPoolId`, `UserPoolClientId`, `ApiUrl`
5. Push project to GitHub/GitLab
6. Connect repo to AWS Amplify Console (set root directory to `frontend/` OR use root `amplify.yml`)
7. In Amplify Console → Environment Variables, set:
   - `VITE_USER_POOL_ID` = value from CognitoStack output
   - `VITE_USER_POOL_CLIENT_ID` = value from CognitoStack output
   - `VITE_API_URL` = value from ApiStack output
   - `VITE_AWS_REGION` = `us-east-1`
8. Trigger a build in Amplify → app goes live

### Subsequent Deploys
- **Frontend**: `git push` → Amplify auto-builds and deploys
- **Backend**: `npx cdk deploy --all` from `infrastructure/`

### Tighten CORS (Post-Deploy)
After Amplify gives you the URL (e.g. `https://main.abc123.amplifyapp.com`):
```
npx cdk deploy --context allowedOrigin=https://main.abc123.amplifyapp.com
```

---

## Verification Checklist

- [ ] `npx cdk synth` produces valid CloudFormation templates with no errors
- [ ] `npx cdk deploy --all` completes; stack outputs are printed
- [ ] Cognito: email sign-up flow sends verification email
- [ ] Cognito: phone sign-up flow sends SMS OTP (requires SNS sandbox exit for non-verified numbers)
- [ ] `POST /extract` with valid Cognito Bearer token returns 12-field JSON
- [ ] `POST /prompts` saves item; `GET /prompts` returns it; `DELETE /prompts/{id}` removes it
- [ ] React: Amplify Authenticator renders, JWT visible in `Authorization` header in Network tab
- [ ] Library page loads prompts, filters work, "Use Prompt" pre-fills the Extractor

---

## Notes & Limitations (MVP)

- **Image prompts only** — no video-specific fields (motion, fps, duration)
- **No anonymous access** — Cognito sign-in required for extraction and saving
- **SNS SMS sandbox** — phone sign-in OTPs will only work for verified phone numbers until sandbox is exited
- **CORS origin is `*` by default** — tighten post-deploy using `--context allowedOrigin=`
- **Bedrock model availability** — `claude-3-haiku` must be enabled in Bedrock Model Access console for your account in `us-east-1`
- **Excluded from MVP**: prompt sharing, ratings/favorites, versioning, image previews
