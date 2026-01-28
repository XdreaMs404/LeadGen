'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProspectForm } from './ProspectForm';
import { useCreateProspect, DuplicateProspectError } from '@/hooks/use-prospects';
import type { ProspectCreateInput } from '@/types/prospect';
import { toast } from 'sonner';

interface AddProspectDialogProps {
    trigger?: React.ReactNode;
}

/**
 * Dialog component for adding a new prospect
 * Story 3.3: Manual Prospect Creation
 * Premium design matching SaaS style
 */
export function AddProspectDialog({ trigger }: AddProspectDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const createProspect = useCreateProspect();

    const handleSubmit = async (data: ProspectCreateInput) => {
        try {
            await createProspect.mutateAsync(data);
            setOpen(false);
        } catch (error) {
            if (error instanceof DuplicateProspectError) {
                // Show error with link to existing prospect
                toast.error(
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">Ce prospect existe déjà</span>
                        {error.prospectId && (
                            <button
                                onClick={() => {
                                    router.push(`/prospects/${error.prospectId}`);
                                    setOpen(false);
                                }}
                                className="text-sm text-violet-400 hover:text-violet-300 underline text-left"
                            >
                                Voir le prospect existant →
                            </button>
                        )}
                    </div>
                );
            }
            // Other errors are handled by the hook
        }
    };

    const handleCancel = () => {
        setOpen(false);
    };

    const defaultTrigger = (
        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30">
            <UserPlus className="h-4 w-4" />
            Ajouter un prospect
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] p-0 gap-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20 border-slate-200 dark:border-slate-800 shadow-2xl">
                {/* Header with gradient */}
                <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl" />

                    <DialogHeader className="relative">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-white/80 text-xs mb-0.5">
                                    <Sparkles className="h-3 w-3" />
                                    <span>Nouveau contact</span>
                                </div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    Ajouter un prospect
                                </DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="text-violet-100 mt-2 text-sm">
                            Ajoutez manuellement un nouveau contact à votre base de prospection.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Form content */}
                <div className="p-6">
                    <ProspectForm
                        onSubmit={handleSubmit}
                        isLoading={createProspect.isPending}
                        onCancel={handleCancel}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
