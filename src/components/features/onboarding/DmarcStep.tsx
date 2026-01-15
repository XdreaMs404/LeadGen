'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getDmarcRecord } from '@/lib/constants/dns-providers';
import type { DnsStatus } from '@/types/dns';
import { toast } from 'sonner';
import { Copy, Check, Shield, HelpCircle, Info } from 'lucide-react';
import { DnsValidationButton } from './DnsValidationButton';
import { useDnsValidation } from '@/hooks/use-dns-validation';

interface DmarcStepProps {
    domain: string | null;
    status: DnsStatus;
    onValidationComplete?: () => void;
    onOverrideRequest?: () => void;
}

export function DmarcStep({ domain, status, onValidationComplete, onOverrideRequest }: DmarcStepProps) {
    const [copied, setCopied] = useState(false);
    const dmarcRecord = domain ? getDmarcRecord(domain) : 'v=DMARC1; p=none; rua=mailto:dmarc@votre-domaine.com';
    const dmarcHost = '_dmarc';
    const { validateDns, isValidating, validationResult, resetValidation } = useDnsValidation();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(dmarcRecord);
            setCopied(true);
            toast.success('Copié dans le presse-papier !', { duration: 2000 });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Erreur lors de la copie');
        }
    };

    const handleValidate = () => {
        resetValidation();
        validateDns(
            { recordType: 'dmarc' },
            {
                onSuccess: (result) => {
                    if (result.status === 'PASS') {
                        toast.success('DMARC validé avec succès !');
                        onValidationComplete?.();
                    }
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            }
        );
    };

    const handleOverride = () => {
        onOverrideRequest?.();
    };

    return (
        <div className="space-y-6">
            {/* Step Header */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                    <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-1">Étape 3 : Configurer DMARC</h3>
                    <p className="text-muted-foreground">
                        DMARC protège votre domaine contre l&apos;usurpation d&apos;identité et améliore votre réputation.
                    </p>
                </div>
            </div>

            {/* Domain Badge */}
            {domain && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                    <span className="text-sm text-muted-foreground">Domaine :</span>
                    <span className="font-semibold">{domain}</span>
                </div>
            )}

            {/* Record to Add */}
            <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                <CardContent className="p-4 space-y-4">
                    {/* Host */}
                    <div>
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Nom de l&apos;enregistrement (Host)</span>
                        </div>
                        <code className="block p-3 bg-slate-200 text-slate-700 rounded-lg text-sm font-mono">
                            {dmarcHost}
                        </code>
                    </div>

                    {/* Value */}
                    <div>
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Valeur (TXT Record)</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className={`h-8 transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                                data-testid="copy-dmarc-button"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 mr-1.5" />
                                        Copié
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                                        Copier
                                    </>
                                )}
                            </Button>
                        </div>
                        <code className="block p-4 bg-slate-900 text-amber-400 rounded-lg text-sm font-mono break-all">
                            {dmarcRecord}
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* Validation Button & Result */}
            <DnsValidationButton
                recordType="dmarc"
                status={status}
                isValidating={isValidating}
                result={validationResult ?? null}
                onValidate={handleValidate}
                onOverride={handleOverride}
            />

            {/* Instructions */}
            <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Comment faire ?
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Accédez à votre gestionnaire DNS (même endroit que pour SPF)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Créez un nouvel enregistrement de type <strong>TXT</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Dans le champ &quot;Nom&quot; ou &quot;Host&quot;, entrez <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">_dmarc</code></span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Collez la valeur copiée ci-dessus pour le champ &quot;Valeur&quot;</span>
                    </li>
                </ol>
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-3">
                    ⏳ Note : La propagation DNS peut prendre quelques minutes. Si la vérification échoue, attendez un peu et réessayez.
                </p>
            </div>

            {/* Policy Explanation */}
            <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Info className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-amber-900 mb-2">Comprendre la politique DMARC</p>
                            <div className="space-y-1.5 text-amber-800">
                                <p>
                                    <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">p=none</code>{' '}
                                    — Mode surveillance (recommandé pour débuter). Les emails non conformes sont livrés normalement.
                                </p>
                                <p>
                                    <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">rua=</code>{' '}
                                    — Adresse où vous recevrez les rapports DMARC agrégés.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pro Tip */}
            <Card className="border-0 bg-slate-50">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                        💡 <strong>Conseil :</strong> Après quelques semaines en mode <code className="px-1 py-0.5 bg-slate-200 rounded text-xs">p=none</code>,
                        vous pourrez passer à <code className="px-1 py-0.5 bg-slate-200 rounded text-xs">p=quarantine</code> puis <code className="px-1 py-0.5 bg-slate-200 rounded text-xs">p=reject</code>
                        pour une protection maximale.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
