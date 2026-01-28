# Story 4.3: Template Variables System with Picker

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to use personalization variables in my emails**,
so that **each recipient gets a customized message**.

## Acceptance Criteria

### Variable Picker (AC1)
1. **Given** a user is editing an email step, **When** they want to insert a variable, **Then** they can click a "Variables" button to open a picker, **And** the picker shows available variables: `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{title}}`, `{{email}}`, **And** clicking a variable inserts it at cursor position.

### Manual Variable Typing (AC2)
2. **Given** a user types a variable manually, **When** they type `{{custom_field}}`, **Then** the system validates if the variable is known, **And** unknown variables are highlighted with a warning: "⚠️ Variable inconnue: custom_field".

### Missing Value Handling (AC3)
3. **Given** a variable has no value for a prospect (e.g., `{{company}}` is empty), **When** the email is previewed, **Then** the variable renders as empty string (no placeholder shown), **And** a warning shows: "⚠️ X prospects ont un champ 'company' vide".

### Variable Preview (AC4)
4. **Given** a user previews an email with variables, **When** they see the preview, **Then** variables are replaced with actual prospect data (or sample data), **And** missing variables are shown as `[vide]` with highlight.

## Tasks / Subtasks

- [x] **Task 1: Define Template Variable Constants (AC: 1, 2)**
  - [x] Create `src/lib/constants/template-variables.ts`
  - [x] Define `TEMPLATE_VARIABLES` array with name, label, description (French)
  - [x] Variables: `first_name`, `last_name`, `company`, `title`, `email`
  - [x] Define `VARIABLE_REGEX` for `{{variable_name}}` pattern matching

- [x] **Task 2: Create Variable Picker Component (AC: 1)**
  - [x] Create `src/components/features/sequences/VariablePicker.tsx`
  - [x] Use shadcn/ui Popover for dropdown
  - [x] List all available variables with French labels
  - [x] On click: insert `{{variable}}` at cursor position
  - [x] Pass `onInsert(variable: string)` callback to parent

- [x] **Task 3: Integrate Picker in StepEditor Toolbar (AC: 1)**
  - [x] Replace "Variables: bientôt disponible" placeholder in `StepEditor.tsx`
  - [x] Add VariablePicker button to toolbar (with icon: Braces)
  - [x] Implement `handleInsertVariable(variable: string)` using Tiptap's insertContent
  - [x] Handle cursor position for insertion

- [x] **Task 4: Variable Validation Function (AC: 2)**
  - [x] Create `src/lib/template/variable-validator.ts`
  - [x] `validateTemplateVariables(text: string): ValidationResult`
  - [x] Return list of valid and invalid variables found
  - [x] Use regex to extract all `{{...}}` patterns
  - [x] Compare against known variables

- [x] **Task 5: Unknown Variable Warning in Editor (AC: 2)**
  - [x] Add validation on editor content change (debounced 500ms)
  - [x] Show inline warning below editor for unknown variables
  - [x] Use Alert component with amber warning style
  - [x] Display: "⚠️ Variable inconnue: {name}"

- [x] **Task 6: Variable Rendering Utility (AC: 3, 4)**
  - [x] Create `src/lib/template/render-variables.ts`
  - [x] `renderTemplate(template: string, prospect: Prospect): RenderResult`
  - [x] Replace known variables with prospect values
  - [x] For empty values: render as empty string OR `[vide]` (preview mode)
  - [x] Return list of missing fields

- [x] **Task 7: Preview with Sample Data (AC: 4)**
  - [x] Create `src/lib/template/sample-prospect.ts`
  - [x] Define `SAMPLE_PROSPECT` for preview mode with realistic French data
  - [x] Example: { firstName: "Marie", lastName: "Dupont", company: "TechCorp", ... }

- [x] **Task 8: Add Preview Panel in StepEditor (AC: 3, 4)**
  - [x] Add "Aperçu" toggle button in StepEditor
  - [x] Create preview panel showing rendered email
  - [x] Use `renderTemplate` with sample prospect
  - [x] Highlight missing variables with amber background
  - [x] Show warning badge if missing fields detected

- [x] **Task 9: Unit Tests**
  - [x] Test variable picker component rendering
  - [x] Test variable insertion at cursor
  - [x] Test regex extraction of variables
  - [x] Test validation of known/unknown variables
  - [x] Test rendering with complete data
  - [x] Test rendering with missing data
  - [x] Test edge cases (nested braces, whitespace)
  - [x] Place tests in `src/__tests__/unit/templates/`

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess` from `lib/guardrails/workspace-check.ts`
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Tests:** Place in `__tests__/unit/templates/` and `__tests__/integration/templates/`
- **French Language:** All user-facing content in French per `config.yaml`
- **Error Handling:** Use warning alerts, not blocking errors for unknown variables

### Template Variable Constants

```typescript
// src/lib/constants/template-variables.ts

export const TEMPLATE_VARIABLES = [
  { name: 'first_name', label: 'Prénom', description: 'Prénom du prospect' },
  { name: 'last_name', label: 'Nom', description: 'Nom de famille du prospect' },
  { name: 'company', label: 'Entreprise', description: 'Nom de l\'entreprise' },
  { name: 'title', label: 'Poste', description: 'Fonction/titre du prospect' },
  { name: 'email', label: 'Email', description: 'Adresse email du prospect' },
] as const;

export type TemplateVariableName = typeof TEMPLATE_VARIABLES[number]['name'];

// Regex to match {{variable_name}} pattern
export const VARIABLE_REGEX = /\{\{([a-z_]+)\}\}/gi;

// Allowed variable names for validation
export const VALID_VARIABLE_NAMES = new Set(TEMPLATE_VARIABLES.map(v => v.name));
```

### Variable Picker Pattern

```tsx
// src/components/features/sequences/VariablePicker.tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Braces } from 'lucide-react';
import { TEMPLATE_VARIABLES } from '@/lib/constants/template-variables';

interface VariablePickerProps {
  onInsert: (variable: string) => void;
}

export function VariablePicker({ onInsert }: VariablePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" title="Insérer une variable">
          <Braces className="h-4 w-4" />
          <span className="ml-1 text-xs">Variables</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">
            Cliquez pour insérer
          </p>
          {TEMPLATE_VARIABLES.map((v) => (
            <Button
              key={v.name}
              variant="ghost"
              size="sm"
              className="w-full justify-start font-mono text-sm"
              onClick={() => onInsert(`{{${v.name}}}`)}
            >
              <code className="text-teal-600">{`{{${v.name}}}`}</code>
              <span className="ml-2 text-muted-foreground">{v.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Tiptap Insert at Cursor

```typescript
// In StepEditor.tsx - handle variable insertion
const handleInsertVariable = useCallback((variable: string) => {
  if (!editor) return;
  
  editor
    .chain()
    .focus()
    .insertContent(variable)
    .run();
}, [editor]);
```

### Variable Rendering Pattern

```typescript
// src/lib/template/render-variables.ts
import { VARIABLE_REGEX, VALID_VARIABLE_NAMES } from '@/lib/constants/template-variables';

export interface RenderResult {
  html: string;
  text: string;
  missingFields: string[];
  invalidVariables: string[];
}

export function renderTemplate(
  template: string,
  prospect: Partial<{
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    title: string | null;
    email: string;
  }>,
  options: { highlightMissing?: boolean } = {}
): RenderResult {
  const missingFields: string[] = [];
  const invalidVariables: string[] = [];
  
  const variableMap: Record<string, string | null | undefined> = {
    first_name: prospect.firstName,
    last_name: prospect.lastName,
    company: prospect.company,
    title: prospect.title,
    email: prospect.email,
  };
  
  const rendered = template.replace(VARIABLE_REGEX, (match, varName) => {
    const lowerName = varName.toLowerCase();
    
    if (!VALID_VARIABLE_NAMES.has(lowerName)) {
      invalidVariables.push(varName);
      return match; // Keep invalid variables as-is
    }
    
    const value = variableMap[lowerName];
    if (value == null || value === '') {
      missingFields.push(varName);
      if (options.highlightMissing) {
        return `<span class="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">[vide]</span>`;
      }
      return '';
    }
    
    return value;
  });
  
  return {
    html: rendered,
    text: rendered.replace(/<[^>]*>/g, ''),
    missingFields,
    invalidVariables,
  };
}
```

### Sample Prospect for Preview

```typescript
// src/lib/template/sample-prospect.ts
export const SAMPLE_PROSPECT = {
  firstName: 'Marie',
  lastName: 'Dupont',
  company: 'TechCorp France',
  title: 'Directrice Marketing',
  email: 'marie.dupont@techcorp.fr',
};
```

### Validation Pattern

```typescript
// src/lib/template/variable-validator.ts
import { VARIABLE_REGEX, VALID_VARIABLE_NAMES } from '@/lib/constants/template-variables';

export interface ValidationResult {
  isValid: boolean;
  validVariables: string[];
  invalidVariables: string[];
}

export function validateTemplateVariables(text: string): ValidationResult {
  const validVariables: string[] = [];
  const invalidVariables: string[] = [];
  
  let match;
  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    const varName = match[1].toLowerCase();
    if (VALID_VARIABLE_NAMES.has(varName)) {
      validVariables.push(varName);
    } else {
      invalidVariables.push(match[1]);
    }
  }
  
  return {
    isValid: invalidVariables.length === 0,
    validVariables: [...new Set(validVariables)],
    invalidVariables: [...new Set(invalidVariables)],
  };
}
```

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `src/lib/constants/template-variables.ts` | NEW | Variable definitions and regex |
| `src/lib/template/variable-validator.ts` | NEW | Validation logic |
| `src/lib/template/render-variables.ts` | NEW | Template rendering |
| `src/lib/template/sample-prospect.ts` | NEW | Sample data for preview |
| `src/components/features/sequences/VariablePicker.tsx` | NEW | Variable picker popover |
| `src/components/features/sequences/StepEditor.tsx` | MODIFY | Replace placeholder, add picker, preview |
| `src/__tests__/unit/templates/variable-validator.test.ts` | NEW | Validation tests |
| `src/__tests__/unit/templates/render-variables.test.ts` | NEW | Rendering tests |
| `src/__tests__/unit/sequences/variable-picker.test.tsx` | NEW | Component tests |

### Previous Story Learnings (from 4.2)

**Patterns Established:**
- Tiptap editor with insertContent API ✅
- shadcn/ui components (Popover, Button) ✅ 
- French localization throughout ✅
- Constants in `lib/constants/` ✅
- Debounced validation patterns (from search) ✅
- Alert component for warnings ✅
- Test organization in `__tests__/unit/` ✅

**Applicable to This Story:**
- Use existing Tiptap `insertContent` for cursor-position insertion
- Follow same shadcn/ui Popover patterns used elsewhere
- French labels consistent with existing UI
- Warning patterns similar to delay validation

### Dependencies (Already Installed)

All dependencies from Stories 4.1/4.2 are available:
- Tiptap for rich text editing
- shadcn/ui components (Popover, Button, Alert)
- Lucide React for icons

### NFR Compliance

- **NFR1:** Actions utilisateur < 500ms → Inline variable insertion is instant
- **NFR17:** Keyboard navigation → Popover is keyboard accessible (Tab, Enter)
- **NFR16:** WCAG 2.1 AA → Proper ARIA labels on buttons

### UX Design References

From UX Design Specification:
- Toolbar button patterns from existing editor
- Popover for quick selection (consistent with link picker)
- Warning alerts for validation issues
- Preview mode with sample data
- Amber color for warnings (consistent with spam risk pattern)

### Existing Code Reference

From StepEditor.tsx (lines 179-182):
```tsx
{/* Variable placeholder slot - future story 4.3 */}
<div className="text-xs text-muted-foreground px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
    Variables: bientôt disponible
</div>
```

This placeholder needs to be REPLACED with the actual VariablePicker component.

### References

- [Epics: Story 4.3](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L964-L997)
- [Architecture: API Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story: 4.2 Step Configuration](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/4-2-step-configuration-delays.md)
- [StepEditor Component](file:///c:/Users/Alexis/Documents/LeadGen/src/components/features/sequences/StepEditor.tsx)
- [FR15: Use template variables](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L40)
- [Prospect Schema](file:///c:/Users/Alexis/Documents/LeadGen/prisma/schema.prisma#L69-L97)

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Antigravity)

### Debug Log References

- Fixed VARIABLE_REGEX to allow digits in variable names (e.g., `custom1`)
- Fixed edge case test for incomplete braces behavior

### Completion Notes List

- ✅ Created template variable constants with 5 supported variables
- ✅ Implemented VariablePicker popover with shadcn/ui and French labels
- ✅ Integrated picker in StepEditor toolbar, replacing placeholder
- ✅ Added debounced validation (500ms) for unknown variables
- ✅ Created variable rendering utility with missing field detection
- ✅ Added preview toggle showing rendered email with sample data
- ✅ Missing values highlighted with amber `[vide]` in preview mode
- ✅ 39 unit tests passing (14 validator, 18 renderer, 7 component)

### File List

**New Files:**
- `src/lib/constants/template-variables.ts`
- `src/lib/template/variable-validator.ts`
- `src/lib/template/render-variables.ts`
- `src/lib/template/sample-prospect.ts`
- `src/components/features/sequences/VariablePicker.tsx`
- `src/__tests__/unit/templates/variable-validator.test.ts`
- `src/__tests__/unit/templates/render-variables.test.ts`
- `src/__tests__/unit/sequences/variable-picker.test.tsx`
- `src/__tests__/unit/sequences/step-api-integrity.test.ts`
- `src/__tests__/unit/sequences/step-delays.test.ts`
- `src/components/features/sequences/SequenceTimeline.tsx`

**Modified Files:**
- `src/components/features/sequences/StepEditor.tsx`

### Contextual Changes (from Story 4.2)
- `src/app/api/sequences/[id]/steps/[stepId]/route.ts`
- `src/app/api/sequences/[id]/steps/reorder/route.ts`
- `src/app/api/sequences/[id]/steps/route.ts`
- `src/components/features/sequences/SequenceBuilder.tsx`
- `src/components/features/sequences/StepCard.tsx`
- `src/lib/constants/sequences.ts`

### Change Log

- 2026-01-28: Implemented Story 4.3 - Template Variables System with Picker
