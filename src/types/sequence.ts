// Sequence TypeScript Types (Story 4.1)

export type SequenceStatusType = 'DRAFT' | 'READY' | 'ARCHIVED';

export interface Sequence {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null; // Story 4.7: Optional description for templates
    isTemplate: boolean; // Story 4.7: Whether this is a template
    sourceTemplateId: string | null; // Story 4.7: Original template ID if created from template
    status: SequenceStatusType;
    steps: SequenceStep[];
    stepsCount?: number; // For list view without loading all steps
    createdAt: string;
    updatedAt: string;
}

export interface SequenceStep {
    id: string;
    sequenceId: string;
    order: number;
    subject: string;
    body: string;
    delayDays: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSequenceInput {
    name: string;
    steps?: Partial<CreateStepInput>[];
}

export interface UpdateSequenceInput {
    name?: string;
    status?: SequenceStatusType;
}

export interface CreateStepInput {
    subject: string;
    body: string;
    delayDays?: number;
}

export interface UpdateStepInput {
    subject?: string;
    body?: string;
    delayDays?: number;
}

export interface ReorderStepsInput {
    stepIds: string[]; // Array of step IDs in new order
}

// List response type with count for pagination
export interface SequenceListItem {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null; // Story 4.7
    isTemplate: boolean; // Story 4.7
    sourceTemplateId: string | null; // Story 4.7
    status: SequenceStatusType;
    stepsCount: number;
    createdAt: string;
    updatedAt: string;
}
