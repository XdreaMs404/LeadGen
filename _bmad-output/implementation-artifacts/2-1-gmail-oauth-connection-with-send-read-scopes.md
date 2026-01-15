# Story 2.1: Gmail OAuth Connection with Send/Read Scopes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user on the onboarding wizard**,
I want **to connect my Gmail inbox with the necessary permissions for sending and reading emails**,
so that **LeadGen can send prospecting emails on my behalf and receive replies**.

## Acceptance Criteria

### Gmail OAuth Connection
1. **Given** a user is on the onboarding wizard, **When** they click "Connect Gmail", **Then** they are redirected to Google OAuth consent screen with additional Gmail scopes, **And** the scopes requested include: `gmail.send`, `gmail.readonly`, `gmail.modify`, **And** after consent, the Gmail OAuth tokens are stored securely (AES-256 encrypted in database).

### Incremental Consent Pattern
2. **Given** a user has already authenticated via Google for login (Story 1.2), **When** they connect Gmail for sending, **Then** the system requests only the additional Gmail scopes (incremental consent), **And** the login session remains active.

### Consent Refusal Handling
3. **Given** a user refuses the Gmail scopes during OAuth, **When** the consent screen returns, **Then** the system displays a clear error: "Gmail access is required to send emails", **And** the user can retry the connection, **And** the user can still explore the app (ICP, import, sequences) without Gmail connected.

### Disconnect Gmail
4. **Given** a user wants to disconnect Gmail, **When** they go to `Settings > Integrations`, **Then** they can see a "Disconnect Gmail" button, **And** clicking it revokes the Gmail tokens, **And** the onboarding status is reset to "not connected".

### Token Refresh Handling
5. **Given** a user has valid Gmail tokens, **When** the access token expires, **Then** the system silently refreshes using the refresh token with exponential backoff (NFR19), **And** no user action is required.

### Token Storage Security
6. **Given** Gmail tokens are stored, **When** persisted to the database, **Then** they are encrypted using AES-256-GCM, **And** encryption key is stored in environment variable, **And** tokens are never logged or exposed to client.

## Tasks / Subtasks

- [x] **Task 1: Database Schema for Gmail Tokens (AC: 1, 6)**
  - [x] Add Prisma model `GmailToken` with fields: `id`, `workspaceId`, `accessToken`, `refreshToken`, `expiresAt`, `email`, `createdAt`, `updatedAt`
  - [x] Create `lib/crypto/encrypt.ts` with AES-256-GCM encrypt/decrypt functions
  - [x] Store encrypted tokens using env `ENCRYPTION_KEY` (32-byte key)
  - [x] Add `ENCRYPTION_KEY` to `.env.example`
  - [x] Run `pnpm prisma migrate dev --name add_gmail_tokens`
  - [x] Write unit tests for encrypt/decrypt functions

- [x] **Task 2: Gmail OAuth Configuration (AC: 1, 2)**
  - [x] Create Google Cloud Console OAuth 2.0 credentials (or reuse existing)
  - [x] Configure scopes: `gmail.send`, `gmail.readonly`, `gmail.modify`
  - [x] Add OAuth redirect URI: `/api/auth/gmail/callback`
  - [x] Add env vars: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` to `.env.example`
  - [x] Document Google OAuth Consent Screen configuration required (restricted scopes verification)

- [x] **Task 3: Gmail OAuth Flow API Routes (AC: 1, 2, 3)**
  - [x] Create `src/app/api/auth/gmail/route.ts` - Initiate OAuth with incremental scopes
  - [x] Create `src/app/api/auth/gmail/callback/route.ts` - Handle callback, exchange code for tokens
  - [x] Implement incremental consent using `include_granted_scopes=true` parameter
  - [x] Store tokens securely using encrypt function from Task 1
  - [x] Handle error: scope denied → return error code `GMAIL_SCOPE_DENIED`
  - [x] Update `Workspace.gmailConnected` flag on success
  - [x] Write integration tests for OAuth flow (mock Google responses)

- [x] **Task 4: Gmail Token Refresh Service (AC: 5)**
  - [x] Create `src/lib/gmail/token-service.ts` with `getValidToken(workspaceId)` function
  - [x] Implement token refresh with exponential backoff (100ms, 200ms, 400ms, max 3 retries)
  - [x] Return cached access token if not expired (5 min buffer)
  - [x] Update `expiresAt` in database on refresh
  - [x] Write unit tests for token refresh logic

- [x] **Task 5: Revoke/Disconnect Gmail (AC: 4)**
  - [x] Create `src/app/api/auth/gmail/revoke/route.ts` - DELETE endpoint
  - [x] Call Google revoke endpoint to invalidate tokens
  - [x] Delete `GmailToken` record from database
  - [x] Update `Workspace.gmailConnected = false`
  - [x] Create UI: `src/components/features/settings/GmailIntegration.tsx`
  - [x] Show connected email address + "Disconnect" button
  - [x] Add confirmation dialog before disconnect
  - [x] Write integration test for revoke flow

- [x] **Task 6: Onboarding Wizard Gmail Step UI (AC: 1, 2, 3)**
  - [x] Create `src/app/(dashboard)/onboarding/page.tsx` - Onboarding wizard entry
  - [x] Create `src/components/features/onboarding/GmailConnectStep.tsx`
  - [x] Show "Connect Gmail" button with Google branding guidelines
  - [x] Show loading state during OAuth redirect
  - [x] Handle error display: "Gmail access is required to send emails"
  - [x] Show success state with connected email after callback
  - [x] Navigate to next step (DNS config) on success

- [x] **Task 7: Update Settings Integrations Page (AC: 4)**
  - [x] Create `src/app/(dashboard)/settings/integrations/page.tsx`
  - [x] Add tab or section for Integrations in Settings
  - [x] Import and display `GmailIntegration` component
  - [x] Show connection status: "Connected as [email]" or "Not connected"

## Dev Notes

### Architecture Patterns & Constraints

- **OAuth Pattern:** Use Google OAuth 2.0 with incremental scopes. Since user already authenticated via Supabase Auth (Story 1.2), we need a SEPARATE Gmail OAuth flow to get Gmail API scopes - Supabase Auth tokens don't include Gmail scopes.
- **Token Storage:** AES-256-GCM encryption at rest (NFR6). Use `crypto` Node.js module, not external packages.
- **Incremental Scopes:** Add `include_granted_scopes=true` to OAuth URL to get only new permissions.
- **Restricted Scopes Warning:** `gmail.modify` and `gmail.readonly` are **restricted scopes** - requires Google verification process before production. For development, use test users in OAuth consent screen.
- **Exponential Backoff:** NFR19 requires retry pattern for Gmail API calls: 100ms → 200ms → 400ms → fail.
- **workspaceId:** Retrieved from session, never from client. Store GmailToken linked to workspaceId.
- **Error Handling:** Use `ApiResponse<T>` pattern from `lib/utils/api-response.ts`.

### Source Tree Components to Touch

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add GmailToken model |
| `src/lib/crypto/encrypt.ts` | NEW | AES-256-GCM encryption |
| `src/lib/gmail/token-service.ts` | NEW | Token management + refresh |
| `src/app/api/auth/gmail/route.ts` | NEW | Initiate Gmail OAuth |
| `src/app/api/auth/gmail/callback/route.ts` | NEW | Handle OAuth callback |
| `src/app/api/auth/gmail/revoke/route.ts` | NEW | Revoke tokens |
| `src/app/(dashboard)/onboarding/page.tsx` | NEW | Onboarding wizard page |
| `src/components/features/onboarding/GmailConnectStep.tsx` | NEW | Gmail connect UI |
| `src/components/features/settings/GmailIntegration.tsx` | NEW | Gmail status + disconnect |
| `src/app/(dashboard)/settings/integrations/page.tsx` | NEW | Integrations settings tab |
| `.env.example` | MODIFY | Add GMAIL_*, ENCRYPTION_KEY |
| `src/__tests__/unit/crypto/encrypt.test.ts` | NEW | Encryption tests |
| `src/__tests__/unit/gmail/token-service.test.ts` | NEW | Token service tests |
| `src/__tests__/integration/gmail-oauth.test.ts` | NEW | OAuth flow tests |

### Testing Standards Summary

- **Unit Tests:**
  - AES-256-GCM encrypt/decrypt roundtrip
  - Token expiry detection (5 min buffer)
  - Exponential backoff timing
  
- **Integration Tests:**
  - OAuth initiation → correct redirect URL with scopes
  - OAuth callback → tokens stored encrypted
  - Scope denied → error response
  - Token refresh → database updated
  - Revoke → tokens deleted + workspace updated

### Previous Story Intelligence (1.5)

- **Patterns Established:**
  - Settings page with tabs exists at `/settings`
  - `SettingsTabs.tsx` component handles General, Security
  - Use `AlertDialog` for destructive confirmations
  - Toast patterns for success/error feedback
  
- **Files to Reuse:**
  - `src/app/(dashboard)/settings/page.tsx` — Add Integrations tab
  - `src/components/features/settings/SettingsTabs.tsx` — Extend with Integrations

### UX Requirements (from UX Spec)

- **Onboarding Wizard:** Step-by-step with WizardStepper component pattern
- **Google Branding:** Follow Google Sign-In button guidelines
- **Error Display:** Clear message "Gmail access is required to send emails" with retry button
- **Success State:** Show connected email with green checkmark
- **Teal Primary:** `hsl(168, 76%, 42%)` for CTAs

### Google OAuth 2.0 Implementation Notes

```typescript
// OAuth URL construction
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', process.env.GMAIL_CLIENT_ID!);
authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', GMAIL_SCOPES.join(' '));
authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
authUrl.searchParams.set('include_granted_scopes', 'true'); // Incremental consent
authUrl.searchParams.set('state', csrfToken); // CSRF protection
```

### Token Exchange (callback)

```typescript
// POST https://oauth2.googleapis.com/token
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: process.env.GMAIL_CLIENT_ID!,
    client_secret: process.env.GMAIL_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }),
});
```

### AES-256-GCM Encryption Pattern

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encrypted (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(encryptedText: string, key: Buffer): string {
  const [ivB64, authTagB64, encryptedB64] = encryptedText.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### Project Context Compliance

> 🚨 Refer to `project-context.md` for mandatory rules.

- **API Response:** All API calls return `ApiResponse<T>` format
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **workspaceId:** NEVER in query params, always from session
- **DB Naming:** `snake_case` in DB, `camelCase` in Prisma with `@map()`

### Prisma Model

```prisma
model GmailToken {
  id            String   @id @default(cuid())
  workspaceId   String   @unique @map("workspace_id")
  accessToken   String   @map("access_token")   // AES-256 encrypted
  refreshToken  String   @map("refresh_token")  // AES-256 encrypted
  expiresAt     DateTime @map("expires_at")
  email         String                          // Gmail email address
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  @@map("gmail_tokens")
}
```

### References

- [Epics: Story 2.1](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L433-L467)
- [Architecture: Auth & Security](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L275-L283)
- [Architecture: Gmail API Limits](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L75-L78)
- [UX: Onboarding Wizard](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L456-L466)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [NFR6: OAuth tokens encrypted AES-256](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L122)
- [NFR19: Gmail retry exponential backoff](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L141)

## Git Intelligence

- No previous commits (new repository)
- Epic 1 completed (Stories 1.1-1.5)
- This is the first story of Epic 2

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

- Prisma migration `add_gmail_tokens` completed successfully
- All 58 tests pass (15 test files)

### Completion Notes List

- **Task 1:** Created `GmailToken` Prisma model with AES-256-GCM encryption for token storage. 13 unit tests for encryption module.
- **Task 2:** Added Gmail OAuth configuration to `.env.example` with `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `ENCRYPTION_KEY`.
- **Task 3:** Implemented OAuth flow with CSRF protection (state cookie), incremental consent, and encrypted token storage.
- **Task 4:** Built token service with exponential backoff (100ms/200ms/400ms) and 5-minute expiry buffer.
- **Task 5:** Created revoke endpoint and `GmailIntegration.tsx` with disconnect confirmation dialog.
- **Task 6:** Built onboarding wizard with `GmailConnectStep.tsx` and progress indicator.
- **Task 7:** Created `/settings/integrations` page showing Gmail connection status.

### File List

**New Files:**
- `prisma/migrations/*_add_gmail_tokens/migration.sql`
- `src/lib/crypto/encrypt.ts`
- `src/lib/gmail/token-service.ts`
- `src/app/api/auth/gmail/route.ts`
- `src/app/api/auth/gmail/callback/route.ts`
- `src/app/api/auth/gmail/revoke/route.ts`
- `src/app/(dashboard)/onboarding/page.tsx`
- `src/app/(dashboard)/settings/integrations/page.tsx`
- `src/components/features/onboarding/GmailConnectStep.tsx`
- `src/components/features/onboarding/OnboardingWizard.tsx`
- `src/components/features/settings/GmailIntegration.tsx`
- `src/__tests__/unit/crypto/encrypt.test.ts`
- `src/__tests__/unit/gmail/token-service.test.ts`
- `src/__tests__/integration/gmail-oauth.test.ts`
- `.env.example`

**Modified Files:**
- `prisma/schema.prisma` (added GmailToken model + Workspace relation)

## Change Log

- 2026-01-14: Implemented Gmail OAuth connection with Send/Read scopes (Story 2.1)
- 2026-01-14: Sr. Dev Code Review (Reviewer: AI) from Code Review Workflow
  - **Outcome:** Approved with Automated Fixes
  - **Fixed:** Updated OAuth flow to handle redirecting back to source page (e.g. Settings vs Onboarding) using `from` parameter.
  - **Fixed:** Added missing unit tests for empty string encryption.
  - **Fixed:** Integrated `GmailIntegration` into `SettingsTabs` and removed orphaned page reference in navigation (while keeping the page for direct access).
  - **Fixed:** Removed debug logs from OAuth API route.
  - **Note:** `gmail.modify` scope flagged as potentially over-privileged but kept per ACs.
