'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { useDnsValidation } from '@/hooks/use-dns-validation';
import { toast } from 'sonner';
import type { DnsRecordType } from '@/lib/dns/dns-constants';

interface ManualOverrideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recordType: DnsRecordType;
    onSuccess?: () => void;
}

/**
 * Manual Override Confirmation Dialog
 *
 * Requires user to acknowledge risks before manually marking
 * a DNS record as verified.
 */
export function ManualOverrideDialog({
    open,
    onOpenChange,
    recordType,
    onSuccess,
}: ManualOverrideDialogProps) {
    const [acknowledged, setAcknowledged] = useState(false);
    const { overrideDns, isOverriding } = useDnsValidation();

    const handleConfirm = () => {
        overrideDns(recordType, {
            onSuccess: () => {
                toast.success(`${recordType.toUpperCase()} marqué comme vérifié`);
                setAcknowledged(false);
                onOpenChange(false);
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setAcknowledged(false);
        }
        onOpenChange(newOpen);
    };

    const recordLabel = {
        spf: 'SPF',
        dkim: 'DKIM',
        dmarc: 'DMARC',
    }[recordType];

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Confirmation requise
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-left">
                            <p>
                                Vous êtes sur le point de marquer {recordLabel} comme vérifié manuellement.
                            </p>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-amber-800 font-medium text-sm">
                                    ⚠️ Sans vérification automatique, vos emails pourraient atterrir en spam.
                                </p>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Utilisez cette option uniquement si vous êtes certain que la configuration est correcte
                                et que la propagation DNS est encore en cours.
                            </p>

                            <div className="flex items-start gap-3 pt-2">
                                <Checkbox
                                    id="acknowledge-risk"
                                    checked={acknowledged}
                                    onCheckedChange={(checked) => setAcknowledged(checked === true)}
                                    data-testid="acknowledge-risk-checkbox"
                                />
                                <Label
                                    htmlFor="acknowledge-risk"
                                    className="text-sm font-normal cursor-pointer leading-relaxed"
                                >
                                    Je comprends les risques et je confirme avoir configuré {recordLabel} correctement.
                                </Label>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isOverriding}>
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={!acknowledged || isOverriding}
                        className="bg-amber-600 hover:bg-amber-700"
                        data-testid="confirm-override-button"
                    >
                        {isOverriding ? 'Confirmation...' : 'Confirmer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
