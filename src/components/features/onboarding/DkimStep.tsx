'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DKIM_SELECTOR_DEFAULT } from '@/lib/constants/dns-providers';
import type { DnsStatus } from '@/types/dns';
import { ExternalLink, Key, HelpCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { DnsValidationButton } from './DnsValidationButton';
import { useDnsValidation } from '@/hooks/use-dns-validation';

interface DkimStepProps {
    domain: string | null;
    status: DnsStatus;
    selector: string | null;
    onValidationComplete?: () => void;
    onOverrideRequest?: () => void;
}

export function DkimStep({ domain, status, selector, onValidationComplete, onOverrideRequest }: DkimStepProps) {
    const [customSelector, setCustomSelector] = useState(selector || DKIM_SELECTOR_DEFAULT);
    const { validateDns, isValidating, validationResult, resetValidation } = useDnsValidation();

    const handleValidate = () => {
        resetValidation();
        validateDns(
            { recordType: 'dkim', selector: customSelector },
            {
                onSuccess: (result) => {
                    if (result.status === 'PASS') {
                        toast.success('DKIM validé avec succès !');
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
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
                    <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-1">Étape 2 : Configurer DKIM</h3>
                    <p className="text-muted-foreground">
                        DKIM signe vos emails pour prouver qu&apos;ils n&apos;ont pas été modifiés en transit.
                    </p>
                </div>
            </div>

            {/* Domain & Selector Info */}
            <div className="flex flex-wrap gap-3">
                {domain && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                        <span className="text-sm text-muted-foreground">Domaine :</span>
                        <span className="font-semibold">{domain}</span>
                    </div>
                )}
            </div>

            {/* Selector Input */}
            <div className="space-y-2">
                <Label htmlFor="dkim-selector" className="text-sm font-medium">
                    Sélecteur DKIM
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="dkim-selector"
                        value={customSelector}
                        onChange={(e) => setCustomSelector(e.target.value)}
                        placeholder="google"
                        className="max-w-xs"
                        data-testid="dkim-selector-input"
                    />
                    <code className="flex items-center px-3 py-2 bg-violet-100 rounded-lg text-violet-700 text-sm font-mono">
                        {customSelector}._domainkey.{domain || 'example.com'}
                    </code>
                </div>
                <p className="text-xs text-muted-foreground">
                    Le sélecteur par défaut pour Google Workspace est &quot;google&quot;. Modifiez si vous avez configuré un sélecteur personnalisé.
                </p>
            </div>

            {/* Validation Button & Result */}
            <DnsValidationButton
                recordType="dkim"
                status={status}
                isValidating={isValidating}
                result={validationResult ?? null}
                onValidate={handleValidate}
                onOverride={handleOverride}
            />

            {/* Important Notice */}
            <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-blue-900 mb-1">Configuration via Google Admin</p>
                            <p className="text-blue-700">
                                DKIM se configure directement dans la console d&apos;administration Google Workspace.
                                Suivez les étapes ci-dessous.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Étapes à suivre
                </h4>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                        <div className="flex-1">
                            <p className="font-medium mb-1">Accédez à Google Admin Console</p>
                            <a
                                href="https://admin.google.com/ac/apps/gmail/authenticateemail"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
                                data-testid="google-admin-link"
                            >
                                Ouvrir Google Admin
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                        <div>
                            <p className="font-medium mb-1">Sélectionnez votre domaine</p>
                            <p className="text-sm text-muted-foreground">
                                Choisissez <strong>{domain || 'votre-domaine.com'}</strong> dans la liste.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                        <div>
                            <p className="font-medium mb-1">Générez une nouvelle clé DKIM</p>
                            <p className="text-sm text-muted-foreground">
                                Cliquez sur &quot;Générer un nouvel enregistrement&quot; et copiez la clé fournie.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                        <div>
                            <p className="font-medium mb-1">Ajoutez l&apos;enregistrement à votre DNS</p>
                            <p className="text-sm text-muted-foreground">
                                Comme pour l&apos;étape SPF, retournez dans votre gestionnaire DNS et créez un enregistrement <strong>TXT</strong> avec le nom <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{customSelector}._domainkey</code> comme Host et la valeur copiée depuis Google Admin.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                        <div>
                            <p className="font-medium mb-1">Démarrez l&apos;authentification</p>
                            <p className="text-sm text-muted-foreground">
                                Retournez dans Google Admin et cliquez sur &quot;Commencer l&apos;authentification&quot;.
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                        ⏳ Note : La propagation DNS peut prendre quelques minutes. Si la vérification échoue, attendez un peu et réessayez.
                    </p>
                </div>
            </div>

            {/* Help Link */}
            <Card className="border-0 bg-slate-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Besoin d&apos;aide détaillée ?</span>
                        <a
                            href="https://support.google.com/a/answer/174124"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
                            data-testid="google-dkim-help-link"
                        >
                            Documentation Google
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
