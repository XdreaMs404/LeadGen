/**
 * useImportProspects Hook
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from './use-workspace';
import type { ApiResponse } from '@/lib/utils/api-response';
import type { ImportResult, ProspectSource } from '@/types/prospect';

interface ImportProspectsParams {
    file: File;
    source: ProspectSource;
    sourceDetail?: string;
    columnMapping: Record<string, string>;
}

async function importProspects(params: ImportProspectsParams): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('source', params.source);
    if (params.sourceDetail) {
        formData.append('sourceDetail', params.sourceDetail);
    }
    formData.append('columnMapping', JSON.stringify(params.columnMapping));

    const response = await fetch('/api/prospects/import', {
        method: 'POST',
        body: formData,
    });

    const json: ApiResponse<ImportResult> = await response.json();

    if (!json.success) {
        throw new Error(json.error.message);
    }

    return json.data;
}

export function useImportProspects() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: importProspects,
        onSuccess: (data) => {
            // Invalidate prospects list cache
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['prospects', workspaceId] });
            }

            // Show success toast with import summary
            const messages: string[] = [];
            if (data.imported > 0) {
                messages.push(`${data.imported} prospect${data.imported > 1 ? 's' : ''} importé${data.imported > 1 ? 's' : ''}`);
            }
            if (data.duplicates > 0) {
                messages.push(`${data.duplicates} doublon${data.duplicates > 1 ? 's' : ''} ignoré${data.duplicates > 1 ? 's' : ''}`);
            }
            if (data.errors > 0) {
                messages.push(`${data.errors} erreur${data.errors > 1 ? 's' : ''}`);
            }

            toast.success('Import terminé', {
                description: messages.join(', '),
            });
        },
        onError: (error: Error) => {
            toast.error('Erreur d\'import', {
                description: error.message || 'Une erreur est survenue lors de l\'import',
            });
        },
    });
}
