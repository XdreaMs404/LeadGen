'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, Save, Plus, Loader2, Layers } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { StepCard } from './StepCard';
import { StepEditor } from './StepEditor';
import { SequenceTimeline } from './SequenceTimeline';
import {
    useSequence,
    useCreateSequence,
    useUpdateSequence,
    useAddStep,
    useUpdateStep,
    useDeleteStep,
    useReorderSteps,
} from '@/hooks/use-sequences';
import type { Sequence, SequenceStep, CreateStepInput } from '@/types/sequence';
import { toast } from 'sonner';

import { MAX_STEPS_PER_SEQUENCE, DEFAULT_DELAY_DAYS } from '@/lib/constants/sequences';

const MAX_STEPS = MAX_STEPS_PER_SEQUENCE;

interface SequenceBuilderProps {
    sequenceId?: string; // null for create mode, id for edit mode
}

/**
 * Sequence Builder Component
 * Story 4.1 - Task 7
 * Full-featured sequence builder with drag-and-drop steps
 */
export function SequenceBuilder({ sequenceId }: SequenceBuilderProps) {
    const router = useRouter();
    const isEditMode = !!sequenceId;

    // Hooks
    const { data: existingSequence, isLoading: isLoadingSequence } = useSequence(sequenceId || null);
    const createSequence = useCreateSequence();
    const updateSequence = useUpdateSequence();
    const addStep = useAddStep();
    const updateStep = useUpdateStep();
    const deleteStep = useDeleteStep();
    const reorderSteps = useReorderSteps();

    // Local state
    const [name, setName] = useState('');
    const [localSteps, setLocalSteps] = useState<SequenceStep[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Step editor dialog state
    const [editorDialogOpen, setEditorDialogOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
    const [stepSubject, setStepSubject] = useState('');
    const [stepBody, setStepBody] = useState('');

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stepToDelete, setStepToDelete] = useState<SequenceStep | null>(null);

    // Sync from server data
    useEffect(() => {
        if (existingSequence) {
            setName(existingSequence.name);
            setLocalSteps(existingSequence.steps);
        }
    }, [existingSequence]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localSteps.findIndex((s) => s.id === active.id);
            const newIndex = localSteps.findIndex((s) => s.id === over.id);

            // Reorder locally
            const newSteps = [...localSteps];
            const [removed] = newSteps.splice(oldIndex, 1);
            newSteps.splice(newIndex, 0, removed);

            // Update order numbers and delays (Story 4.2 - AC3 & AC6)
            const updatedSteps = newSteps.map((step, idx) => {
                const newOrder = idx + 1;
                let delayDays = step.delayDays;

                if (newOrder === 1) {
                    // Moving TO first position -> reset to 0
                    delayDays = 0;
                } else if (step.order === 1 && newOrder > 1) {
                    // Moving FROM first position -> set default
                    delayDays = DEFAULT_DELAY_DAYS;
                }

                return {
                    ...step,
                    order: newOrder,
                    delayDays,
                };
            });

            setLocalSteps(updatedSteps);

            // If editing, persist to server
            if (isEditMode && sequenceId) {
                reorderSteps.mutate({
                    sequenceId,
                    data: { stepIds: updatedSteps.map(s => s.id) },
                });
            }
        }
    }, [localSteps, isEditMode, sequenceId, reorderSteps]);

    // Add new step
    const handleAddStep = useCallback(() => {
        if (localSteps.length >= MAX_STEPS) {
            toast.error('Maximum 3 étapes par séquence');
            return;
        }

        // For edit mode, create step on server
        if (isEditMode && sequenceId) {
            setEditingStep(null);
            setStepSubject('');
            setStepBody('');
            setEditorDialogOpen(true);
        } else {
            // For create mode, add temp step locally
            const tempStep: SequenceStep = {
                id: `temp-${Date.now()}`,
                sequenceId: '',
                order: localSteps.length + 1,
                subject: '',
                body: '',
                delayDays: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setLocalSteps([...localSteps, tempStep]);
            setEditingStep(tempStep);
            setStepSubject('');
            setStepBody('');
            setEditorDialogOpen(true);
        }
    }, [localSteps, isEditMode, sequenceId]);

    // Save step from editor
    const handleSaveStep = useCallback(async () => {
        if (!stepSubject.trim() || !stepBody.trim()) {
            toast.error('Veuillez remplir l\'objet et le contenu');
            return;
        }

        if (isEditMode && sequenceId) {
            if (editingStep && !editingStep.id.startsWith('temp-')) {
                // Update existing step
                await updateStep.mutateAsync({
                    sequenceId,
                    stepId: editingStep.id,
                    data: { subject: stepSubject, body: stepBody },
                });
            } else {
                // Create new step
                await addStep.mutateAsync({
                    sequenceId,
                    data: { subject: stepSubject, body: stepBody },
                });
            }
        } else {
            // Update local step for create mode
            if (editingStep) {
                setLocalSteps(localSteps.map(s =>
                    s.id === editingStep.id
                        ? { ...s, subject: stepSubject, body: stepBody }
                        : s
                ));
            }
        }

        setEditorDialogOpen(false);
        setEditingStep(null);
    }, [stepSubject, stepBody, editingStep, isEditMode, sequenceId, addStep, updateStep, localSteps]);

    // Edit step
    const handleEditStep = useCallback((step: SequenceStep) => {
        setEditingStep(step);
        setStepSubject(step.subject);
        setStepBody(step.body);
        setEditorDialogOpen(true);
    }, []);

    // Story 4.2 - AC2: Handle delay change from StepCard
    const handleDelayChange = useCallback(async (step: SequenceStep, delayDays: number) => {
        if (isEditMode && sequenceId && !step.id.startsWith('temp-')) {
            // Persist to server
            await updateStep.mutateAsync({
                sequenceId,
                stepId: step.id,
                data: { delayDays },
            });
        } else {
            // Update locally for create mode
            setLocalSteps(prevSteps => prevSteps.map(s =>
                s.id === step.id ? { ...s, delayDays } : s
            ));
        }
    }, [isEditMode, sequenceId, updateStep]);

    // Delete step
    const handleDeleteClick = useCallback((step: SequenceStep) => {
        setStepToDelete(step);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!stepToDelete) return;

        if (isEditMode && sequenceId && !stepToDelete.id.startsWith('temp-')) {
            await deleteStep.mutateAsync({ sequenceId, stepId: stepToDelete.id });
        } else {
            // Remove locally
            setLocalSteps(localSteps.filter(s => s.id !== stepToDelete.id));
        }

        setDeleteDialogOpen(false);
        setStepToDelete(null);
    }, [stepToDelete, isEditMode, sequenceId, deleteStep, localSteps]);

    // Save sequence
    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            toast.error('Veuillez donner un nom à la séquence');
            return;
        }

        if (localSteps.length === 0) {
            toast.error('Ajoutez au moins une étape à votre séquence');
            return;
        }

        // Check all steps have content
        const incompleteStep = localSteps.find(s => !s.subject.trim() || !s.body.trim());
        if (incompleteStep) {
            toast.error('Veuillez compléter toutes les étapes');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && sequenceId) {
                await updateSequence.mutateAsync({
                    sequenceId,
                    data: { name: name.trim() },
                });

                // For existing sequences, we still need to manage steps individually if they were changed locally
                // But in this builder we save immediate step changes via dialog, so this is mostly for name updates

                toast.success('Séquence enregistrée');
            } else {
                // Atomic creation
                await createSequence.mutateAsync({
                    name: name.trim(),
                    steps: localSteps.map(step => ({
                        subject: step.subject,
                        body: step.body,
                        delayDays: step.delayDays
                    }))
                });

                toast.success('Séquence enregistrée');
                router.push('/sequences');
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    }, [name, localSteps, isEditMode, sequenceId, createSequence, updateSequence, addStep, router]);

    const canAddStep = localSteps.length < MAX_STEPS;

    if (isEditMode && isLoadingSequence) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/sequences">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? 'Modifier la séquence' : 'Nouvelle séquence'}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {isEditMode ? 'Modifiez votre séquence d\'emails' : 'Créez une séquence de maximum 3 étapes'}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer
                    </Button>
                </div>

                {/* Sequence name */}
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Nom de la séquence
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Prospection PME - Relance douce"
                                className="max-w-lg bg-white dark:bg-slate-800"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Steps section */}
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-teal-600" />
                            Étapes ({localSteps.length}/{MAX_STEPS})
                        </CardTitle>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleAddStep}
                                        disabled={!canAddStep}
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ajouter une étape
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!canAddStep && (
                                <TooltipContent>
                                    Maximum 3 étapes par séquence
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {localSteps.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune étape pour l&apos;instant</p>
                                <p className="text-sm">Cliquez sur &quot;Ajouter une étape&quot; pour commencer</p>
                            </div>
                        ) : (
                            <>
                                {/* Story 4.2 - AC5: Visual Timeline */}
                                {localSteps.length > 1 && (
                                    <SequenceTimeline steps={localSteps} className="mb-4" />
                                )}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={localSteps.map(s => s.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {localSteps.map((step, index) => (
                                                <StepCard
                                                    key={step.id}
                                                    step={step}
                                                    stepNumber={index + 1}
                                                    onEdit={handleEditStep}
                                                    onDelete={handleDeleteClick}
                                                    onDelayChange={handleDelayChange}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Step Editor Dialog */}
                <Dialog open={editorDialogOpen} onOpenChange={setEditorDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingStep && !editingStep.id.startsWith('temp-')
                                    ? `Modifier l'étape ${localSteps.findIndex(s => s.id === editingStep.id) + 1}`
                                    : 'Nouvelle étape'}
                            </DialogTitle>
                        </DialogHeader>
                        <StepEditor
                            subject={stepSubject}
                            body={stepBody}
                            onSubjectChange={setStepSubject}
                            onBodyChange={setStepBody}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setEditorDialogOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSaveStep}
                                className="bg-gradient-to-r from-teal-600 to-emerald-600"
                            >
                                Enregistrer l&apos;étape
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete step confirmation */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette étape ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. L&apos;étape sera définitivement supprimée.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
