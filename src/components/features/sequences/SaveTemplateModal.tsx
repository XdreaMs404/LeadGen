'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSaveAsTemplate } from '@/hooks/use-sequences';
import type { SequenceListItem } from '@/types/sequence';

interface SaveTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sequence: SequenceListItem | null;
    onSuccess?: () => void;
}

/**
 * Save as Template Modal Component
 * Story 4.7 - AC1
 * Dialog for entering template name and description when saving
 */
export function SaveTemplateModal({ open, onOpenChange, sequence, onSuccess }: SaveTemplateModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const saveAsTemplate = useSaveAsTemplate();

    // Reset form when sequence changes
    const resetForm = () => {
        setName('');
        setDescription('');
    };

    const handleSave = async () => {
        if (!sequence) return;

        try {
            await saveAsTemplate.mutateAsync({
                sequenceId: sequence.id,
                name: name.trim() || undefined,
                description: description.trim() || undefined,
            });
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        } catch {
            // Error handled by hook's onError
        }
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-violet-500" />
                        Enregistrer comme modèle
                    </DialogTitle>
                    <DialogDescription>
                        Créez un modèle réutilisable à partir de &quot;{sequence?.name}&quot;
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Nom du modèle</Label>
                        <Input
                            id="template-name"
                            placeholder={`${sequence?.name ?? 'Séquence'} (Modèle)`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                        />
                        <p className="text-xs text-slate-500">
                            Laissez vide pour utiliser le nom par défaut
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="template-description">Description (optionnel)</Label>
                        <Textarea
                            id="template-description"
                            placeholder="Décrivez l'usage de ce modèle..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saveAsTemplate.isPending}
                    >
                        {saveAsTemplate.isPending ? 'Enregistrement...' : 'Enregistrer le modèle'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
