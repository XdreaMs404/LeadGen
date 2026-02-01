/**
 * Sequence Clone Service (Story 4.7)
 * 
 * Provides functionality to deep clone sequences including all steps.
 * Used for both "Duplicate Sequence" and "Save as Template" features.
 */

import { prisma } from '@/lib/prisma/client';
import type { Sequence as PrismaSequence, SequenceStep as PrismaSequenceStep } from '@prisma/client';

export interface CloneSequenceOptions {
    /** New name for the cloned sequence (defaults to original name + " (Copie)") */
    newName?: string;
    /** Description for the cloned sequence (used for templates) */
    description?: string;
    /** Whether the clone should be marked as a template */
    isTemplate?: boolean;
    /** Track which template this was created from (not set when saving AS template) */
    trackSourceTemplate?: boolean;
}

export interface ClonedSequence extends PrismaSequence {
    steps: PrismaSequenceStep[];
}

/**
 * Deep clones a sequence with all its steps.
 * Creates completely independent copies with new IDs.
 * 
 * @param sequenceId - ID of the sequence to clone
 * @param workspaceId - ID of the workspace (for ownership validation)
 * @param options - Clone options
 * @returns The cloned sequence with all steps
 * @throws Error if sequence not found or doesn't belong to workspace
 */
export async function cloneSequence(
    sequenceId: string,
    workspaceId: string,
    options: CloneSequenceOptions = {}
): Promise<ClonedSequence> {
    return prisma.$transaction(async (tx) => {
        // 1. Fetch original sequence with all steps
        const original = await tx.sequence.findUnique({
            where: { id: sequenceId },
            include: {
                steps: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!original) {
            throw new Error('Sequence not found');
        }

        if (original.workspaceId !== workspaceId) {
            throw new Error('Sequence does not belong to this workspace');
        }

        // 2. Determine the new sequence name
        const newName = options.newName ?? `${original.name} (Copie)`;

        // 3. Create the new sequence
        const newSequence = await tx.sequence.create({
            data: {
                workspaceId,
                name: newName,
                description: options.description ?? null,
                isTemplate: options.isTemplate ?? false,
                // Only set sourceTemplateId when creating FROM a template, not when saving AS template
                sourceTemplateId: options.trackSourceTemplate ? original.id : null,
                status: 'DRAFT' // New sequences always start as DRAFT
            }
        });

        // 4. Clone all steps with new IDs
        const clonedSteps: PrismaSequenceStep[] = [];

        for (const step of original.steps) {
            const clonedStep = await tx.sequenceStep.create({
                data: {
                    sequenceId: newSequence.id,
                    order: step.order,
                    subject: step.subject,
                    body: step.body,
                    delayDays: step.delayDays
                }
            });
            clonedSteps.push(clonedStep);
        }

        // Return the complete cloned sequence with steps
        return {
            ...newSequence,
            steps: clonedSteps
        };
    });
}
