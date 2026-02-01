'use client';

import { useState } from 'react';
import { Layers, FileText, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplates, useCreateFromTemplate, useDeleteSequence } from '@/hooks/use-sequences';
import type { SequenceListItem } from '@/types/sequence';

interface TemplateSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (sequenceId: string) => void;
}

/**
 * Template Selector Modal Component
 * Story 4.7 - AC2
 * Displays list of templates and allows creating a new sequence from them
 * Also allows deleting templates
 */
export function TemplateSelector({ open, onOpenChange, onSuccess }: TemplateSelectorProps) {
    const { data, isLoading } = useTemplates();
    const createFromTemplate = useCreateFromTemplate();
    const deleteSequence = useDeleteSequence();
    const [selectedTemplate, setSelectedTemplate] = useState<SequenceListItem | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<SequenceListItem | null>(null);

    const handleCreateFromTemplate = async (template: SequenceListItem) => {
        try {
            const sequence = await createFromTemplate.mutateAsync({ templateId: template.id });
            onOpenChange(false);
            setSelectedTemplate(null);
            onSuccess?.(sequence.id);
        } catch {
            // Error handled by hook's onError
        }
    };

    const handleDeleteTemplate = (e: React.MouseEvent, template: SequenceListItem) => {
        e.stopPropagation(); // Prevent selection when clicking delete
        setTemplateToDelete(template);
    };

    const confirmDeleteTemplate = () => {
        if (templateToDelete) {
            deleteSequence.mutate(templateToDelete.id, {
                onSuccess: () => {
                    setTemplateToDelete(null);
                    // Clear selection if deleted template was selected
                    if (selectedTemplate?.id === templateToDelete.id) {
                        setSelectedTemplate(null);
                    }
                },
            });
        }
    };

    const templates = data?.templates ?? [];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-violet-500" />
                            Nouveau depuis un modèle
                        </DialogTitle>
                        <DialogDescription>
                            Sélectionnez un modèle pour créer une nouvelle séquence
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                        {isLoading && (
                            <>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <Skeleton className="h-5 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </>
                        )}

                        {!isLoading && templates.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>Aucun modèle disponible</p>
                                <p className="text-sm mt-1">
                                    Enregistrez une séquence comme modèle pour la voir ici
                                </p>
                            </div>
                        )}

                        {!isLoading && templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className={`relative p-4 rounded-lg border text-left transition-all cursor-pointer group
                                    ${selectedTemplate?.id === template.id
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {/* Delete button */}
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteTemplate(e, template)}
                                    className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Supprimer ce modèle"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>

                                <div className="font-medium text-slate-900 dark:text-white pr-8">
                                    {template.name}
                                </div>
                                {template.description && (
                                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">
                                        {template.description}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-2">
                                    <Layers className="h-3.5 w-3.5" />
                                    <span>{template.stepsCount} étape{template.stepsCount > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {templates.length > 0 && (
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Annuler
                            </Button>
                            <Button
                                onClick={() => selectedTemplate && handleCreateFromTemplate(selectedTemplate)}
                                disabled={!selectedTemplate || createFromTemplate.isPending}
                            >
                                {createFromTemplate.isPending ? 'Création...' : 'Créer depuis ce modèle'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce modèle ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le modèle &quot;{templateToDelete?.name}&quot; sera définitivement supprimé.
                            Les séquences créées depuis ce modèle ne seront pas affectées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteTemplate}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

