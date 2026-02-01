'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Sequence, SequenceListItem, SequenceStep, CreateSequenceInput, UpdateSequenceInput, CreateStepInput, UpdateStepInput, ReorderStepsInput } from '@/types/sequence';
import type { ApiResponse } from '@/lib/utils/api-response';

// ===== Response Types =====

interface SequencesResponse {
    sequences: SequenceListItem[];
}

// ===== useSequences Query Hook (Story 4.1 - AC6) =====

/**
 * Hook for fetching all sequences for the current workspace
 */
export function useSequences() {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['sequences', workspaceId] as const,
        queryFn: async (): Promise<SequencesResponse> => {
            const res = await fetch('/api/sequences');
            const json: ApiResponse<SequencesResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        placeholderData: keepPreviousData,
        enabled: !!workspaceId,
    });
}

// ===== useSequence Query Hook (Story 4.1 - AC1, AC3) =====

/**
 * Hook for fetching a single sequence with its steps
 */
export function useSequence(sequenceId: string | null) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['sequences', workspaceId, sequenceId] as const,
        queryFn: async (): Promise<Sequence> => {
            const res = await fetch(`/api/sequences/${sequenceId}`);
            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        enabled: !!workspaceId && !!sequenceId,
    });
}

// ===== useCreateSequence Mutation Hook (Story 4.1 - AC1, AC4) =====

/**
 * Hook for creating a new sequence
 */
export function useCreateSequence() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (data: CreateSequenceInput): Promise<Sequence> => {
            const res = await fetch('/api/sequences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (sequence) => {
            toast.success('Séquence créée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId] });
            }
            return sequence;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la création');
        },
    });
}

// ===== useUpdateSequence Mutation Hook (Story 4.1 - AC4) =====

/**
 * Hook for updating a sequence (name, status)
 */
export function useUpdateSequence() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ sequenceId, data }: { sequenceId: string; data: UpdateSequenceInput }): Promise<Sequence> => {
            const res = await fetch(`/api/sequences/${sequenceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (sequence) => {
            toast.success('Séquence enregistrée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId, sequence.id] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la mise à jour');
        },
    });
}

// ===== useDeleteSequence Mutation Hook (Story 4.1) =====

/**
 * Hook for deleting a sequence
 */
export function useDeleteSequence() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (sequenceId: string): Promise<void> => {
            const res = await fetch(`/api/sequences/${sequenceId}`, {
                method: 'DELETE',
            });

            const json: ApiResponse<{ deleted: boolean }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }
        },
        onSuccess: () => {
            toast.success('Séquence supprimée');
            if (workspaceId) {
                // Invalidate both sequences and templates (since templates are sequences with isTemplate=true)
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la suppression');
        },
    });
}


// ===== useAddStep Mutation Hook (Story 4.1 - AC2, AC3) =====

/**
 * Hook for adding a step to a sequence
 */
export function useAddStep() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ sequenceId, data }: { sequenceId: string; data: CreateStepInput }): Promise<SequenceStep> => {
            const res = await fetch(`/api/sequences/${sequenceId}/steps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<SequenceStep> = await res.json();

            if (!json.success) {
                // Special handling for max steps reached
                if (json.error.code === 'MAX_STEPS_REACHED') {
                    throw new MaxStepsReachedError(json.error.message);
                }
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (_, { sequenceId }) => {
            toast.success('Étape ajoutée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId, sequenceId] });
            }
        },
        onError: (error: Error) => {
            if (error instanceof MaxStepsReachedError) {
                toast.error('Maximum 3 étapes par séquence');
                return;
            }
            toast.error(error.message || 'Erreur lors de l\'ajout');
        },
    });
}

// ===== useUpdateStep Mutation Hook (Story 4.1 - AC3) =====

/**
 * Hook for updating a step
 */
export function useUpdateStep() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ sequenceId, stepId, data }: { sequenceId: string; stepId: string; data: UpdateStepInput }): Promise<SequenceStep> => {
            const res = await fetch(`/api/sequences/${sequenceId}/steps/${stepId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<SequenceStep> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (_, { sequenceId }) => {
            toast.success('Étape mise à jour');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId, sequenceId] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la mise à jour');
        },
    });
}

// ===== useDeleteStep Mutation Hook (Story 4.1 - AC8) =====

/**
 * Hook for deleting a step
 */
export function useDeleteStep() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ sequenceId, stepId }: { sequenceId: string; stepId: string }): Promise<void> => {
            const res = await fetch(`/api/sequences/${sequenceId}/steps/${stepId}`, {
                method: 'DELETE',
            });

            const json: ApiResponse<{ deleted: boolean }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }
        },
        onSuccess: (_, { sequenceId }) => {
            toast.success('Étape supprimée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId, sequenceId] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la suppression');
        },
    });
}

// ===== useReorderSteps Mutation Hook (Story 4.1 - AC7) =====

/**
 * Hook for reordering steps in a sequence
 */
export function useReorderSteps() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ sequenceId, data }: { sequenceId: string; data: ReorderStepsInput }): Promise<void> => {
            const res = await fetch(`/api/sequences/${sequenceId}/steps/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<{ reordered: boolean }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }
        },
        onSuccess: (_, { sequenceId }) => {
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId, sequenceId] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors du réordonnancement');
        },
    });
}

// ===== useApproveSequence Mutation Hook (Story 4.5 - AC4) =====

/**
 * Hook for approving a sequence (set status to READY)
 * Uses PATCH endpoint which validates that sequence has at least one step
 */
export function useApproveSequence() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (sequenceId: string): Promise<Sequence> => {
            const res = await fetch(`/api/sequences/${sequenceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'READY' }),
            });

            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (sequence) => {
            toast.success('Séquence approuvée et prête à l\'envoi');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId, sequence.id] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de l\'approbation');
        },
    });
}

// ===== useDuplicateSequence Mutation Hook (Story 4.7 - AC3, AC4) =====

/**
 * Hook for duplicating a sequence
 */
export function useDuplicateSequence() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (sequenceId: string): Promise<Sequence> => {
            const res = await fetch(`/api/sequences/${sequenceId}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (sequence) => {
            toast.success('Séquence dupliquée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId] });
            }
            return sequence;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la duplication');
        },
    });
}

// ===== useSaveAsTemplate Mutation Hook (Story 4.7 - AC1) =====

/**
 * Hook for saving a sequence as a template
 */
export function useSaveAsTemplate() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ sequenceId, name, description }: {
            sequenceId: string;
            name?: string;
            description?: string;
        }): Promise<Sequence> => {
            const res = await fetch(`/api/sequences/${sequenceId}/save-as-template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });

            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: () => {
            toast.success('Modèle enregistré');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de l\'enregistrement du modèle');
        },
    });
}

// ===== useTemplates Query Hook (Story 4.7 - AC2) =====

interface TemplatesResponse {
    templates: SequenceListItem[];
}

/**
 * Hook for fetching all templates for the current workspace
 */
export function useTemplates() {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['templates', workspaceId] as const,
        queryFn: async (): Promise<TemplatesResponse> => {
            const res = await fetch('/api/templates');
            const json: ApiResponse<TemplatesResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        placeholderData: keepPreviousData,
        enabled: !!workspaceId,
    });
}

// ===== useCreateFromTemplate Mutation Hook (Story 4.7 - AC2) =====

/**
 * Hook for creating a sequence from a template
 */
export function useCreateFromTemplate() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ templateId, name }: { templateId: string; name?: string }): Promise<Sequence> => {
            const res = await fetch(`/api/templates/${templateId}/create-sequence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            const json: ApiResponse<Sequence> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (sequence) => {
            toast.success('Séquence créée depuis le modèle');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['sequences', workspaceId] });
            }
            return sequence;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la création depuis le modèle');
        },
    });
}

// ===== Custom Error Classes =====

/**
 * Custom error for max steps reached
 */
export class MaxStepsReachedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MaxStepsReachedError';
    }
}
