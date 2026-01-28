'use client';

import * as React from 'react';
import { Lock, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockedTooltip } from './BlockedTooltip';
import { useCanSend } from '@/hooks/use-can-send';

interface LaunchButtonProps {
    /** Callback when launch is triggered */
    onLaunch: () => void;
    /** Additional disabled state from parent */
    disabled?: boolean;
    /** Custom label */
    label?: string;
    /** Custom class name */
    className?: string;
}

/**
 * Campaign launch button that integrates with pre-send guardrails.
 * 
 * - Disabled with tooltip when user can't send (onboarding incomplete, Gmail issues)
 * - Enabled when all pre-send checks pass
 * - Shows loading state while checking
 */
export function LaunchButton({
    onLaunch,
    disabled = false,
    label = 'Lancer la campagne',
    className = 'w-full',
}: LaunchButtonProps) {
    const { canSend, blockedReason, isLoading } = useCanSend();

    const isDisabled = disabled || !canSend || isLoading;

    // Loading state
    if (isLoading) {
        return (
            <Button disabled className={className}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
            </Button>
        );
    }

    // Blocked state - show tooltip with reason
    if (!canSend && blockedReason) {
        return (
            <BlockedTooltip
                reason={blockedReason}
                wizardLink="/settings/onboarding"
            >
                <Button disabled className={className}>
                    <Lock className="mr-2 h-4 w-4" />
                    {label}
                </Button>
            </BlockedTooltip>
        );
    }

    // Enabled state
    return (
        <Button
            onClick={onLaunch}
            disabled={isDisabled}
            className={className}
        >
            <Rocket className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}
