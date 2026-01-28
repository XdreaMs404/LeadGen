'use client';

import * as React from 'react';
import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface BlockedTooltipProps {
    /** Human-readable reason for blocking */
    reason: string;
    /** Link to wizard/fix page */
    wizardLink?: string;
    /** Label for the wizard link */
    wizardLinkLabel?: string;
    /** Children to wrap with tooltip */
    children: React.ReactNode;
}

/**
 * Tooltip component that wraps disabled buttons with an explanation.
 * Shows blocking reason and optional link to fix the issue.
 */
export function BlockedTooltip({
    reason,
    wizardLink,
    wizardLinkLabel = 'Configurer maintenant →',
    children,
}: BlockedTooltipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-block w-full cursor-not-allowed">
                    {children}
                </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] p-3">
                <p className="text-sm">{reason}</p>
                {wizardLink && (
                    <Link
                        href={wizardLink}
                        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                        {wizardLinkLabel}
                    </Link>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
