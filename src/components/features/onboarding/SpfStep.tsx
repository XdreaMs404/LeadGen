'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DNS_PROVIDERS, SPF_RECORD } from '@/lib/constants/dns-providers';
import type { DnsStatus } from '@/types/dns';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Server, HelpCircle } from 'lucide-react';
import { DnsValidationButton } from './DnsValidationButton';
import { useDnsValidation } from '@/hooks/use-dns-validation';

interface SpfStepProps {
    domain: string | null;
    status: DnsStatus;
    onValidationComplete?: () => void;
    onOverrideRequest?: () => void;
}

export function SpfStep({ domain, status, onValidationComplete, onOverrideRequest }: SpfStepProps) {
    const [copied, setCopied] = useState(false);
    const { validateDns, isValidating, validationResult, resetValidation } = useDnsValidation();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(SPF_RECORD);
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
            { recordType: 'spf' },
            {
                onSuccess: (result) => {
                    if (result.status === 'PASS') {
                        toast.success('SPF validé avec succès !');
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
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25">
                    <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-1">Étape 1 : Configurer SPF</h3>
                    <p className="text-muted-foreground">
                        SPF indique aux serveurs quels expéditeurs sont autorisés à envoyer des emails pour votre domaine.
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
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Enregistrement TXT à ajouter</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className={`h-8 transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                            data-testid="copy-spf-button"
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
                    <code className="block p-4 bg-slate-900 text-emerald-400 rounded-lg text-sm font-mono break-all">
                        {SPF_RECORD}
                    </code>
                </CardContent>
            </Card>

            {/* Validation Button & Result */}
            <DnsValidationButton
                recordType="spf"
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
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Connectez-vous à votre gestionnaire de noms de domaine (OVH, Namecheap, Cloudflare...)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Accédez à la section &quot;DNS&quot; ou &quot;Zone DNS&quot;</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Ajoutez un nouvel enregistrement de type <strong>TXT</strong> avec <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">@</code> comme Host</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Collez la valeur copiée ci-dessus dans le champ &quot;Valeur&quot;</span>
                    </li>
                </ol>
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-3">
                    ⏳ Note : La propagation DNS peut prendre quelques minutes. Si la vérification échoue, attendez un peu et réessayez.
                </p>
            </div>

            {/* Provider Links */}
            <div className="space-y-3">
                <h4 className="font-semibold text-sm">Guides par hébergeur</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DNS_PROVIDERS.map((provider) => (
                        <a
                            key={provider.name}
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50/50 transition-colors group"
                            data-testid={`provider-${provider.name.toLowerCase()}`}
                        >
                            <span className="text-sm font-medium">{provider.name}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
