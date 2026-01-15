'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RotateCw, ShieldQuestion } from 'lucide-react';
import type { DnsValidationResult, DnsStatus } from '@/types/dns';

interface DnsValidationButtonProps {
    recordType: 'spf' | 'dkim' | 'dmarc';
    status: DnsStatus;
    isValidating: boolean;
    result: DnsValidationResult | null;
    onValidate: () => void;
    onOverride: () => void;
    showOverrideButton?: boolean;
}

/**
 * Validation Button with Result Display
 *
 * Shows:
 * - "Vérifier" button when not started or after retry
 * - Loading spinner during validation
 * - PASS: Green checkmark with success message
 * - FAIL: Red X with error message and "Pourquoi?" details
 * - UNKNOWN: Yellow warning with override option
 * - MANUAL_OVERRIDE: Blue indicator for manual status
 */
export function DnsValidationButton({
    recordType,
    status,
    isValidating,
    result,
    onValidate,
    onOverride,
    showOverrideButton = true,
}: DnsValidationButtonProps) {
    const [showDetails, setShowDetails] = useState(false);

    // Get status display
    const getStatusDisplay = () => {
        // If we have a fresh validation result, use it
        if (result) {
            return {
                status: result.status,
                message: result.message,
                rawRecord: result.rawRecord,
            };
        }

        // Otherwise use persisted status
        switch (status) {
            case 'PASS':
                return { status: 'PASS' as const, message: getSuccessMessage() };
            case 'FAIL':
                return { status: 'FAIL' as const, message: getFailMessage() };
            case 'UNKNOWN':
                return { status: 'UNKNOWN' as const, message: 'Résultat inconnu' };
            case 'MANUAL_OVERRIDE':
                return { status: 'MANUAL_OVERRIDE' as const, message: 'Vérifié manuellement' };
            default:
                return null;
        }
    };

    const getSuccessMessage = () => {
        switch (recordType) {
            case 'spf':
                return 'SPF configuré correctement';
            case 'dkim':
                return 'DKIM configuré correctement';
            case 'dmarc':
                return 'DMARC configuré correctement';
        }
    };

    const getFailMessage = () => {
        switch (recordType) {
            case 'spf':
                return 'SPF non configuré';
            case 'dkim':
                return 'DKIM non trouvé';
            case 'dmarc':
                return 'DMARC non configuré';
        }
    };

    const statusDisplay = getStatusDisplay();
    const showValidateButton = status === 'NOT_STARTED' || status === 'FAIL' || status === 'UNKNOWN';
    const showRetryButton = statusDisplay?.status === 'FAIL' || statusDisplay?.status === 'UNKNOWN';
    const canOverride = showOverrideButton && (statusDisplay?.status === 'FAIL' || statusDisplay?.status === 'UNKNOWN');

    return (
        <div className="space-y-3">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {showValidateButton && (
                    <Button
                        onClick={onValidate}
                        disabled={isValidating}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                        data-testid={`validate-${recordType}-button`}
                    >
                        {isValidating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Vérification...
                            </>
                        ) : (
                            <>Vérifier {recordType.toUpperCase()}</>
                        )}
                    </Button>
                )}

                {showRetryButton && !isValidating && status !== 'NOT_STARTED' && (
                    <Button
                        variant="outline"
                        onClick={onValidate}
                        data-testid={`retry-${recordType}-button`}
                    >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Réessayer
                    </Button>
                )}

                {canOverride && (
                    <Button
                        variant="ghost"
                        onClick={onOverride}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        data-testid={`override-${recordType}-button`}
                    >
                        <ShieldQuestion className="h-4 w-4 mr-2" />
                        Marquer comme vérifié
                    </Button>
                )}
            </div>

            {/* Result Display */}
            {statusDisplay && (
                <Card
                    className={`border-0 ${statusDisplay.status === 'PASS'
                        ? 'bg-emerald-50'
                        : statusDisplay.status === 'FAIL'
                            ? 'bg-red-50'
                            : statusDisplay.status === 'MANUAL_OVERRIDE'
                                ? 'bg-blue-50'
                                : 'bg-amber-50'
                        }`}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {/* Status Icon */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusDisplay.status === 'PASS'
                                    ? 'bg-emerald-100'
                                    : statusDisplay.status === 'FAIL'
                                        ? 'bg-red-100'
                                        : statusDisplay.status === 'MANUAL_OVERRIDE'
                                            ? 'bg-blue-100'
                                            : 'bg-amber-100'
                                    }`}
                            >
                                {statusDisplay.status === 'PASS' && (
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                )}
                                {statusDisplay.status === 'FAIL' && (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                {statusDisplay.status === 'UNKNOWN' && (
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                                {statusDisplay.status === 'MANUAL_OVERRIDE' && (
                                    <ShieldQuestion className="h-4 w-4 text-blue-600" />
                                )}
                            </div>

                            {/* Status Content */}
                            <div className="flex-1">
                                <p
                                    className={`font-medium ${statusDisplay.status === 'PASS'
                                        ? 'text-emerald-800'
                                        : statusDisplay.status === 'FAIL'
                                            ? 'text-red-800'
                                            : statusDisplay.status === 'MANUAL_OVERRIDE'
                                                ? 'text-blue-800'
                                                : 'text-amber-800'
                                        }`}
                                >
                                    {statusDisplay.message}
                                </p>

                                {/* FAIL: Show "Pourquoi?" toggle */}
                                {statusDisplay.status === 'FAIL' && (
                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="text-sm text-red-600 hover:text-red-700 mt-1 underline"
                                    >
                                        {showDetails ? 'Masquer les détails' : 'Pourquoi ?'}
                                    </button>
                                )}

                                {showDetails && statusDisplay.status === 'FAIL' && (
                                    <div className="mt-2 p-3 bg-red-100 rounded-lg text-sm text-red-700">
                                        <p className="font-medium mb-1">Comment corriger ?</p>
                                        <p>
                                            {recordType === 'spf' && "Ajoutez un enregistrement TXT avec include:_spf.google.com"}
                                            {recordType === 'dkim' && "Configurez DKIM dans Google Admin Console"}
                                            {recordType === 'dmarc' && "Ajoutez un enregistrement TXT _dmarc avec v=DMARC1"}
                                        </p>
                                    </div>
                                )}

                                {/* Show raw record on success */}
                                {statusDisplay.status === 'PASS' && statusDisplay.rawRecord && (
                                    <code className="block mt-2 p-2 bg-emerald-100 rounded text-xs text-emerald-700 font-mono break-all">
                                        {statusDisplay.rawRecord}
                                    </code>
                                )}

                                {/* UNKNOWN: Show propagation message */}
                                {statusDisplay.status === 'UNKNOWN' && (
                                    <p className="text-sm text-amber-700 mt-1">
                                        La propagation DNS peut prendre jusqu&apos;à 48h. Vous pouvez réessayer plus tard ou marquer comme vérifié.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
