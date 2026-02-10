'use client';

/**
 * Auto-Pause Banner Component
 * Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)
 * 
 * Displays when a campaign was auto-paused due to high bounce/unsubscribe rates
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info, PlayCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AutoPauseReason, AUTO_PAUSE_MESSAGES } from '@/types/anomaly-detection';

interface AutoPauseBannerProps {
    autoPausedReason: AutoPauseReason;
    bounceRate?: number;
    unsubscribeRate?: number;
    onResume: (acknowledgeRisk: boolean) => void;
    isResuming?: boolean;
}

/**
 * Banner displayed when a campaign was auto-paused
 * Shows reason, explanation, next steps, and resume with acknowledgment
 */
export function AutoPauseBanner({
    autoPausedReason,
    bounceRate,
    unsubscribeRate,
    onResume,
    isResuming = false,
}: AutoPauseBannerProps) {
    const [showWhy, setShowWhy] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    const message = AUTO_PAUSE_MESSAGES[autoPausedReason];

    // Display the relevant rate
    const rate = autoPausedReason === 'HIGH_BOUNCE_RATE'
        ? bounceRate
        : autoPausedReason === 'HIGH_UNSUBSCRIBE_RATE'
            ? unsubscribeRate
            : undefined;

    const handleResume = () => {
        if (acknowledged) {
            onResume(true);
        }
    };

    return (
        <Alert variant="destructive" className="mb-6 border-red-500 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
                {message.title}
                {rate !== undefined && (
                    <span className="ml-2 text-red-600 dark:text-red-400">
                        ({rate.toFixed(1)}%)
                    </span>
                )}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
                <p className="text-muted-foreground">
                    Cette campagne a été automatiquement mise en pause pour protéger votre réputation d&apos;expéditeur.
                </p>

                {/* Why section */}
                <Collapsible open={showWhy} onOpenChange={setShowWhy}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                        <Info className="h-4 w-4" />
                        Pourquoi ?
                        {showWhy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 rounded-md bg-muted p-3 text-sm">
                        {message.description}
                    </CollapsibleContent>
                </Collapsible>

                {/* Next steps section */}
                <Collapsible open={showSteps} onOpenChange={setShowSteps}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                        <Info className="h-4 w-4" />
                        Prochaines étapes
                        {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 rounded-md bg-muted p-3">
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {message.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                    </CollapsibleContent>
                </Collapsible>

                {/* Resume section */}
                <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-white p-4 dark:border-red-800 dark:bg-red-950/30">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="acknowledge-risk"
                            checked={acknowledged}
                            onCheckedChange={(checked) => setAcknowledged(checked === true)}
                            disabled={isResuming}
                        />
                        <label
                            htmlFor="acknowledge-risk"
                            className="text-sm font-medium cursor-pointer"
                        >
                            J&apos;ai compris le risque et j&apos;ai vérifié les recommandations ci-dessus
                        </label>
                    </div>
                    <Button
                        onClick={handleResume}
                        disabled={!acknowledged || isResuming}
                        variant="outline"
                        className="w-fit"
                    >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {isResuming ? 'Reprise en cours...' : 'Reprendre la campagne'}
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
