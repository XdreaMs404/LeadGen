# Story 2.5: Sending Blocking Gate

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to prevent email sending until deliverability onboarding is complete**,
so that **users cannot damage their domain reputation before proper setup**.

## Acceptance Criteria

### Campaign Launch Blocked (AC1)
1. **Given** a user has NOT completed onboarding (`onboardingComplete === false`), **When** they try to launch a campaign, **Then** the launch button is disabled, **And** a tooltip explains: "Complétez la configuration de délivrabilité d'abord", **And** a link navigates to the onboarding wizard.

### Email Scheduling Blocked (AC2)
2. **Given** a user has NOT completed onboarding, **When** they try to schedule emails for sending, **Then** the schedule action is blocked at API level, **And** an error response explains the requirement with code `ONBOARDING_INCOMPLETE`.

### Soft Gate for Exploration (AC3)
3. **Given** a user has NOT completed onboarding, **When** they try to access Prospects, Sequences, or ICP settings, **Then** access is ALLOWED (soft gate), **And** they can import prospects, create sequences, preview emails, **And** only the "send" and "launch" actions are blocked.

### Onboarding Complete Enables Sending (AC4)
4. **Given** a user completes onboarding (`onboardingComplete === true`), **When** they return to the campaign launch screen, **Then** the launch button is enabled, **And** they can proceed with sending.

### Token Expiry/Revoke Blocks Sending (AC5)
5. **Given** a user's Gmail tokens expire or are revoked, **When** they try to send emails, **Then** sending is blocked, **And** they are prompted to reconnect Gmail, **And** the error code is `GMAIL_TOKEN_INVALID`.

### Pre-Send Guardrails Check (AC6)
6. **Given** any email sending attempt (manual or scheduled), **When** the system processes the send request, **Then** pre-send guardrails are checked: onboardingComplete, gmailConnected, valid tokens, **And** all checks must pass before any email is sent.

## Tasks / Subtasks

- [x] **Task 1: Pre-Send Check Service (AC: 2, 5, 6)**
  - [x] Create `src/lib/guardrails/pre-send-check.ts`
  - [x] Implement `checkCanSend(workspaceId): Promise<PreSendCheckResult>`
  - [x] Check 1: `workspace.onboardingComplete === true`
  - [x] Check 2: Gmail connected (via GmailToken relation)
  - [x] Check 3: Gmail token exists and is not expired
  - [x] Return structured result: `{ canSend: boolean; blockedReason?: string; code?: string }`

- [x] **Task 2: PreSendCheckResult Type Definition (AC: 6)**
  - [x] Create/Update `src/types/guardrails.ts`
  - [x] Define `PreSendCheckResult = { canSend: boolean; blockedReason?: string; code?: PreSendBlockCode }`
  - [x] Define `PreSendBlockCode = 'ONBOARDING_INCOMPLETE' | 'GMAIL_NOT_CONNECTED' | 'GMAIL_TOKEN_INVALID' | 'QUOTA_EXCEEDED'`

- [x] **Task 3: Campaign Launch Gate API (AC: 1, 4)**
  - [x] Create `src/app/api/campaigns/check-launch/route.ts` - GET endpoint
  - [x] Call `checkCanSend(workspaceId)`
  - [x] Return `ApiResponse<{ canLaunch: boolean; blockedReason?: string }>`
  - [x] Used by frontend to enable/disable launch button

- [x] **Task 4: Schedule Email Gate Integration (AC: 2)**
  - [x] Modify future email scheduling API (placeholder for Epic 5)
  - [x] Add pre-send check before scheduling any email
  - [x] Return error `{ success: false, error: { code: 'ONBOARDING_INCOMPLETE', message: '...' } }`
  - [x] Document integration point for Epic 5 implementation (see Dev Notes)

- [x] **Task 5: Gmail Token Validation (AC: 5)**
  - [x] Enhance `src/lib/gmail/token-service.ts`
  - [x] Implement `isTokenValid(workspaceId): Promise<boolean>`
  - [x] Check token exists in database
  - [x] Check token expiry date (if stored)
  - [x] Attempt token refresh if expired
  - [x] Return false if refresh fails

- [x] **Task 6: useCanSend Hook (AC: 1, 4)**
  - [x] Create `src/hooks/use-can-send.ts` with TanStack Query
  - [x] Query key: `['can-send', workspaceId]`
  - [x] Return `{ canSend, blockedReason, isLoading }`
  - [x] Refetch on onboarding status changes (via window focus)

- [x] **Task 7: Campaign Launch Button UI (AC: 1, 3, 4)**
  - [x] Create `src/components/shared/LaunchButton.tsx`
  - [x] Use `useCanSend` hook to determine enabled state
  - [x] If `canSend === false`: disable button + show tooltip with blockedReason
  - [x] If `canSend === true`: enable button with normal styling
  - [x] Include link to onboarding wizard in tooltip

- [x] **Task 8: BlockedTooltip Component (AC: 1)**
  - [x] Create `src/components/shared/BlockedTooltip.tsx`
  - [x] Wraps disabled buttons with explanation
  - [x] Props: `{ reason: string; wizardLink?: string }`
  - [x] French content: "Complétez la configuration de délivrabilité d'abord"
  - [x] Link: "Configurer maintenant →"

- [x] **Task 9: Reconnect Gmail Prompt (AC: 5)**
  - [x] Create `src/components/shared/ReconnectGmailPrompt.tsx`
  - [x] Shown when Gmail token is invalid
  - [x] Message: "Votre connexion Gmail a expiré. Reconnectez-vous pour continuer à envoyer."
  - [x] CTA: "Reconnecter Gmail" → triggers Gmail OAuth flow

- [x] **Task 10: Unit & Integration Tests**
  - [x] Test `checkCanSend` returns correct result for all scenarios
  - [x] Test: onboarding incomplete → canSend: false
  - [x] Test: Gmail not connected → canSend: false
  - [x] Test: token expired → canSend: false
  - [x] Test: all conditions met → canSend: true
  - [x] Test API route requires authentication
  - [x] Test UI disables button correctly (via LaunchButton integration)

## Dev Notes

### Architecture Patterns & Constraints

- **Guardrails Pattern:** Pre-send checks are NON-BYPASSABLE at API level
- **Soft Gate:** UI exploration allowed, only send/launch blocked
- **Multi-Tenant:** workspaceId resolved from session, never from query params
- **API Response:** Use `ApiResponse<T>` pattern from `lib/utils/api-response.ts`
- **Error Codes:** Standardized codes for frontend handling
- **French Language:** All user-facing content in French per `config.yaml`

### Pre-Send Check Logic

```typescript
// src/lib/guardrails/pre-send-check.ts
export async function checkCanSend(workspaceId: string): Promise<PreSendCheckResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { onboardingComplete: true, gmailConnected: true }
  });
  
  if (!workspace) {
    return { canSend: false, code: 'WORKSPACE_NOT_FOUND', blockedReason: 'Workspace introuvable' };
  }
  
  if (!workspace.onboardingComplete) {
    return { 
      canSend: false, 
      code: 'ONBOARDING_INCOMPLETE', 
      blockedReason: 'Complétez la configuration de délivrabilité d\'abord' 
    };
  }
  
  if (!workspace.gmailConnected) {
    return { 
      canSend: false, 
      code: 'GMAIL_NOT_CONNECTED', 
      blockedReason: 'Connectez votre compte Gmail' 
    };
  }
  
  // Check Gmail token validity
  const tokenValid = await isTokenValid(workspaceId);
  if (!tokenValid) {
    return { 
      canSend: false, 
      code: 'GMAIL_TOKEN_INVALID', 
      blockedReason: 'Votre connexion Gmail a expiré' 
    };
  }
  
  return { canSend: true };
}
```

### Source Tree Components to Touch

| File | Action | Notes |
|------|--------|-------|
| `src/lib/guardrails/pre-send-check.ts` | NEW | Core pre-send check service |
| `src/types/guardrails.ts` | NEW | PreSendCheckResult types |
| `src/app/api/campaigns/check-launch/route.ts` | NEW | Launch check endpoint |
| `src/lib/gmail/token-service.ts` | MODIFY | Add isTokenValid function |
| `src/hooks/use-can-send.ts` | NEW | TanStack Query hook |
| `src/components/shared/LaunchButton.tsx` | NEW | Guarded launch button |
| `src/components/shared/BlockedTooltip.tsx` | NEW | Tooltip for disabled actions |
| `src/components/shared/ReconnectGmailPrompt.tsx` | NEW | Token expiry prompt |
| `src/__tests__/unit/guardrails/pre-send-check.test.ts` | NEW | Unit tests |
| `src/__tests__/integration/check-launch.test.ts` | NEW | API tests |

### Testing Standards Summary

- **Unit Tests:**
  - `checkCanSend` returns correct result for each scenario
  - All block codes are tested
  - Token validation logic

- **Integration Tests:**
  - API requires authentication
  - API returns correct `ApiResponse<T>` format
  - UI correctly enables/disables based on API response

### Previous Story Intelligence (2.1-2.4)

**Patterns Established:**
- Workspace model has: `onboardingComplete`, `gmailConnected`, `spfStatus`, `dkimStatus`, `dmarcStatus`
- `GmailToken` model stores encrypted access/refresh tokens
- Token service in `src/lib/gmail/token-service.ts`
- Onboarding status hook: `useOnboardingStatus`

**Files to Reuse:**
- `src/lib/gmail/token-service.ts` — Enhance with validation
- `src/lib/utils/api-response.ts` — Response helpers
- `src/hooks/use-onboarding-status.ts` — Pattern reference

### Integration Points for Future Epics

**Epic 5 Integration (Campaign Launch & Sending):**
- Call `checkCanSend` before any email is scheduled
- Call `checkCanSend` before campaign launch is processed
- Return appropriate error if checks fail

**Document for Epic 5:**
```typescript
// In campaign launch API route (Epic 5)
const preSendCheck = await checkCanSend(workspaceId);
if (!preSendCheck.canSend) {
  return error(preSendCheck.code, preSendCheck.blockedReason);
}
// Proceed with campaign launch...
```

### UX Requirements (from UX Spec)

- **Protection Visible:** Blocking gate explains WHY user can't send
- **Not Frustrating:** User can still explore (import, create sequences)
- **Clear Path Forward:** Link to complete onboarding always visible
- **Tooltip Pattern:** Use shadcn Tooltip for disabled buttons
- **French Language:** All messages in French

### Component Structure Example

```typescript
// src/components/shared/LaunchButton.tsx
interface LaunchButtonProps {
  onLaunch: () => void;
  disabled?: boolean;
}

export function LaunchButton({ onLaunch, disabled }: LaunchButtonProps) {
  const { canSend, blockedReason, isLoading } = useCanSend();
  
  const isDisabled = disabled || !canSend || isLoading;
  
  if (!canSend && blockedReason) {
    return (
      <BlockedTooltip 
        reason={blockedReason} 
        wizardLink="/settings/onboarding"
      >
        <Button disabled className="w-full">
          <Lock className="mr-2 h-4 w-4" />
          Lancer la campagne
        </Button>
      </BlockedTooltip>
    );
  }
  
  return (
    <Button onClick={onLaunch} disabled={isDisabled} className="w-full">
      <Rocket className="mr-2 h-4 w-4" />
      Lancer la campagne
    </Button>
  );
}
```

### Project Context Compliance

> 🚨 Refer to `project-context.md` for mandatory rules.

- **API Response:** All API calls return `ApiResponse<T>` format
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **workspaceId:** NEVER in query params, always from session
- **Guardrails:** Pre-send checks are NON-BYPASSABLE (see architecture)
- **Error Handling:** Structured error codes for frontend handling

### References

- [Epics: Story 2.5](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L587-L626)
- [Architecture: Guardrails](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L86-L96)
- [Architecture: Pre-Send Check](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L623-L625)
- [Project Context: Guardrails](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md#L39-L44)
- [Previous Story 2.4](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/2-4-onboarding-progress-status-tracking.md)

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (via Antigravity)

### Debug Log References

N/A - No issues encountered during implementation.

### Completion Notes List

- **Task 1-2:** Created `PreSendCheckResult` types and `checkCanSend` service with 3-tier validation (onboarding → Gmail connected → token valid)
- **Task 3:** Implemented `/api/campaigns/check-launch` GET endpoint returning `ApiResponse<CanLaunchResponse>`
- **Task 4:** Pre-send check is designed for Epic 5 integration - just call `checkCanSend(workspaceId)` before scheduling emails
- **Task 5:** Added `isTokenValid()` to token-service using existing `getValidToken()` with try/catch wrapper
- **Task 6:** Created `useCanSend` hook with TanStack Query, 30s stale time, refetch on window focus
- **Task 7-9:** Created UI components with French content and shadcn tooltip integration
- **Task 10:** All 24 tests pass (7 unit + 6 integration + 11 token-service)


### Review Follow-ups (AI)

> 2026-01-15: Adversarial Review by Dev Agent found issues.

- [x] **Task 4 (Fix):** Created `src/app/api/campaigns/schedule/route.ts` as a placeholder to properly implement the guardrail integration claim.
- [x] **Task 10 (Fix):** Created `src/__tests__/unit/components/shared/LaunchButton.test.tsx` to properly test the UI component logic.
- [x] **Security (Verification):** Confirmed `getWorkspaceId` is safe for MVP single-workspace model, but noted future multi-tenant requirement.

### File List

**New Files:**
- `src/types/guardrails.ts`
- `src/lib/guardrails/pre-send-check.ts`
- `src/app/api/campaigns/check-launch/route.ts`
- `src/app/api/campaigns/schedule/route.ts` (Added in review)
- `src/hooks/use-can-send.ts`
- `src/components/shared/BlockedTooltip.tsx`
- `src/components/shared/LaunchButton.tsx`
- `src/components/shared/ReconnectGmailPrompt.tsx`
- `src/__tests__/unit/guardrails/pre-send-check.test.ts`
- `src/__tests__/integration/check-launch.test.ts`
- `src/__tests__/unit/components/shared/LaunchButton.test.tsx` (Added in review)

**Modified Files:**
- `src/lib/gmail/token-service.ts` (added `isTokenValid` function)
- `src/__tests__/unit/gmail/token-service.test.ts` (added `isTokenValid` tests)

## Change Log

- 2026-01-14: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
- 2026-01-15: Implementation complete by Dev Agent - all 10 tasks done, 24 tests passing
- 2026-01-15: Code Review passed - fixed Task 4 implementation gap and added missing UI tests. Status: done.
