'use client';

/**
 * SpamRiskBadge Component
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 4: Create SpamRiskBadge Component
 *
 * Displays a color-coded badge indicating the spam risk level:
 * - LOW: Green badge "✓ Risque faible"
 * - MEDIUM: Amber badge "⚠️ Risque moyen"
 * - HIGH: Red badge "⛔ Risque élevé"
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { SpamRiskLevel, type SpamWarning } from '@/lib/sequences/spam-analyzer';
import { cn } from '@/lib/utils';

interface SpamRiskBadgeProps {
    /** The spam risk level */
    riskLevel: SpamRiskLevel;
    /** The spam score (0-100+) */
    score: number;
    /** List of spam warnings */
    warnings: SpamWarning[];
    /** Whether details panel is expanded (for MEDIUM/HIGH) */
    isExpanded?: boolean;
    /** Callback when details toggle is clicked */
    onToggleExpand?: () => void;
    /** Optional className */
    className?: string;
}

/**
 * SpamRiskBadge - Displays a risk indicator badge for spam analysis
 */
export function SpamRiskBadge({
    riskLevel,
    score,
    warnings,
    isExpanded = false,
    onToggleExpand,
    className,
}: SpamRiskBadgeProps) {
    const warningCount = warnings.length;
    const hasToggle = (riskLevel === SpamRiskLevel.MEDIUM || riskLevel === SpamRiskLevel.HIGH) && onToggleExpand;

    // Configuration based on risk level
    const config = {
        [SpamRiskLevel.LOW]: {
            variant: 'success' as const,
            icon: CheckCircle2,
            label: 'Risque faible',
            bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        },
        [SpamRiskLevel.MEDIUM]: {
            variant: 'warning' as const,
            icon: AlertTriangle,
            label: 'Risque moyen',
            bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        },
        [SpamRiskLevel.HIGH]: {
            variant: 'destructive' as const,
            icon: ShieldAlert,
            label: 'Risque élevé',
            bgClass: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        },
    };

    const { icon: Icon, label, bgClass } = config[riskLevel];
    const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors border',
                bgClass,
                hasToggle && 'cursor-pointer hover:opacity-80',
                className
            )}
            onClick={hasToggle ? onToggleExpand : undefined}
            role={hasToggle ? 'button' : undefined}
            aria-expanded={hasToggle ? isExpanded : undefined}
            aria-label={`${label}${warningCount > 0 ? `, ${warningCount} avertissement${warningCount > 1 ? 's' : ''}` : ''}`}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{label}</span>
            {warningCount > 0 && riskLevel !== SpamRiskLevel.LOW && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-current/10 text-[10px]">
                    {warningCount}
                </span>
            )}
            {hasToggle && (
                <ChevronIcon className="h-3 w-3 ml-0.5" aria-hidden="true" />
            )}
        </Badge>
    );
}
