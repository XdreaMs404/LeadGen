# 🔥 Code Review Findings: Story 4.1

**Story:** [4-1-sequence-creation-max-3-steps.md](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/4-1-sequence-creation-max-3-steps.md)
**Reviewer:** BMad Adversarial Reviewer

## Git vs Story Discrepancies
- **Found 1 Discrepancy:**
  - Story claims tasks are complete `[x]`, but almost ALL implementation files are currently **untracked** (newly created but not added to git).

## 🔴 Critical Issues
*None found.*

## 🟡 Medium Issues

### 1. Untracked Implementation Files
**Severity:** MEDIUM
**Location:** Multiple files (`src/app/api/sequences/...`, `src/components/features/sequences/...`)
**Description:** The Code Review workflow detected that 18+ files are marked `??` (Untracked) in git. These must be added and committed to ensuring the work is safe.

### 2. Non-Atomic Sequence Creation
**Severity:** MEDIUM
**Location:** `src/components/features/sequences/SequenceBuilder.tsx` (Line 274-286)
**Description:** The "Save" logic creates the sequence via API, then loops to add steps one by one.
```typescript
const newSequence = await createSequence.mutateAsync({ name: name.trim() });
for (const step of localSteps) {
    await addStep.mutateAsync({ ... });
}
```
**Risk:** If the user creates a sequence and has network issues during the loop (or closes the tab), we are left with a "Zombie" empty sequence in the DRAFT state. The API validation for "Minimal 1 step" is respected *UI side*, but the database state can become inconsistent with the intent.
**Recommendation:** Implement a transactional endpoint `POST /api/sequences` that accepts `{ name, steps: [...] }` to create everything atomically.

## 🟢 Low Issues

### 3. Duplicate Constant Definition
**Severity:** LOW
**Location:** `SequenceBuilder.tsx` (Line 61) & `api/sequences/[id]/steps/route.ts` (Line 9)
**Description:** `MAX_STEPS = 3` is defined in both places.
**Recommendation:** Move to a shared constant file `src/lib/constants/sequences.ts` to ensure frontend and backend are always in sync.

### 4. Loading State UX Inconsistency
**Severity:** LOW
**Location:** `src/app/(dashboard)/sequences/page.tsx` (Line 67)
**Description:** The page uses a text-based "Chargement..." fallback during hydration, which overrides the Skeleton loading in `SequenceList`. This creates a layout shift or "flash" of text before the skeletons appear.
**Recommendation:** Use a proper loading.tsx or render the Skeleton grid directly during the `!isMounted` phase to match the server-side output.

---

## Decision

**What should I do with these issues?**

1. **Fix them automatically** - I'll update the code (atomic transaction, shared constant, files commit).
2. **Create action items** - Add to story Tasks for later.
3. **Show me details** - Deep dive into specific issues.
