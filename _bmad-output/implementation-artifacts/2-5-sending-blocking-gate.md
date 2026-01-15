# Story 2.5: Sending Blocking Gate

Status: ready-for-dev

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

- [ ] **Task 1: Pre-Send Check Service (AC: 2, 5, 6)**
  - [ ] Create `src/lib/guardrails/pre-send-check.ts`
  - [ ] Implement `checkCanSend(workspaceId): Promise<PreSendCheckResult>`
  - [ ] Check 1: `workspace.onboardingComplete === true`
  - [ ] Check 2: `workspace.gmailConnected === true`
  - [ ] Check 3: Gmail token exists and is not expired
  - [ ] Return structured result: `{ canSend: boolean; blockedReason?: string; code?: string }`

- [ ] **Task 2: PreSendCheckResult Type Definition (AC: 6)**
  - [ ] Create/Update `src/types/guardrails.ts`
  - [ ] Define `PreSendCheckResult = { canSend: boolean; blockedReason?: string; code?: PreSendBlockCode }`
  - [ ] Define `PreSendBlockCode = 'ONBOARDING_INCOMPLETE' | 'GMAIL_NOT_CONNECTED' | 'GMAIL_TOKEN_INVALID' | 'QUOTA_EXCEEDED'`

- [ ] **Task 3: Campaign Launch Gate API (AC: 1, 4)**
  - [ ] Create `src/app/api/campaigns/check-launch/route.ts` - GET endpoint
  - [ ] Call `checkCanSend(workspaceId)`
  - [ ] Return `ApiResponse<{ canLaunch: boolean; blockedReason?: string }>`
  - [ ] Used by frontend to enable/disable launch button

- [ ] **Task 4: Schedule Email Gate Integration (AC: 2)**
  - [ ] Modify future email scheduling API (placeholder for Epic 5)
  - [ ] Add pre-send check before scheduling any email
  - [ ] Return error `{ success: false, error: { code: 'ONBOARDING_INCOMPLETE', message: '...' } }`
  - [ ] Document integration point for Epic 5 implementation

- [ ] **Task 5: Gmail Token Validation (AC: 5)**
  - [ ] Enhance `src/lib/gmail/token-service.ts`
  - [ ] Implement `isTokenValid(workspaceId): Promise<boolean>`
  - [ ] Check token exists in database
  - [ ] Check token expiry date (if stored)
  - [ ] Attempt token refresh if expired
  - [ ] Return false if refresh fails

- [ ] **Task 6: useCanSend Hook (AC: 1, 4)**
  - [ ] Create `src/hooks/use-can-send.ts` with TanStack Query
  - [ ] Query key: `['can-send', workspaceId]`
  - [ ] Return `{ canSend, blockedReason, isLoading }`
  - [ ] Refetch on onboarding status changes

- [ ] **Task 7: Campaign Launch Button UI (AC: 1, 3, 4)**
  - [ ] Create `src/components/shared/LaunchButton.tsx` (or enhance existing)
  - [ ] Use `useCanSend` hook to determine enabled state
  - [ ] If `canSend === false`: disable button + show tooltip with blockedReason
  - [ ] If `canSend === true`: enable button with normal styling
  - [ ] Include link to onboarding wizard in tooltip

- [ ] **Task 8: BlockedTooltip Component (AC: 1)**
  - [ ] Create `src/components/shared/BlockedTooltip.tsx`
  - [ ] Wraps disabled buttons with explanation
  - [ ] Props: `{ reason: string; wizardLink?: string }`
  - [ ] French content: "Complétez la configuration de délivrabilité d'abord"
  - [ ] Link: "Configurer maintenant →"

- [ ] **Task 9: Reconnect Gmail Prompt (AC: 5)**
  - [ ] Create `src/components/shared/ReconnectGmailPrompt.tsx`
  - [ ] Shown when Gmail token is invalid
  - [ ] Message: "Votre connexion Gmail a expiré. Reconnectez-vous pour continuer à envoyer."
  - [ ] CTA: "Reconnecter Gmail" → triggers Gmail OAuth flow

- [ ] **Task 10: Unit & Integration Tests**
  - [ ] Test `checkCanSend` returns correct result for all scenarios
  - [ ] Test: onboarding incomplete → canSend: false
  - [ ] Test: Gmail not connected → canSend: false
  - [ ] Test: token expired → canSend: false
  - [ ] Test: all conditions met → canSend: true
  - [ ] Test API route requires authentication
  - [ ] Test UI disables button correctly

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-01-14: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
