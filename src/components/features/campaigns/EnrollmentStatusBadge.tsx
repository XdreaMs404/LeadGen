/**
 * EnrollmentStatusBadge Component
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Displays color-coded badge for prospect enrollment status with tooltip.
 * Also reflects campaign-level status (paused/stopped) when applicable.
 * Displays special "Duplicate" status for prospects already in another campaign with same sequence.
 */

'use client';

import { EnrollmentStatus, CampaignStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Play,
    Pause,
    StopCircle,
    CheckCircle,
    MessageCircle,
    Copy,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface EnrollmentStatusBadgeProps {
    status: EnrollmentStatus;
    enrolledAt?: string | null;
    pausedAt?: string | null;
    completedAt?: string | null;
    className?: string;
    /** Optional: Campaign status to reflect campaign-level paused/stopped state */
    campaignStatus?: CampaignStatus;
    /** Optional: Whether this prospect is a duplicate (already in another campaign with same sequence) */
    isDuplicate?: boolean;
}

interface StatusConfig {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    bgClass: string;
    textClass: string;
    Icon: React.ComponentType<{ className?: string }>;
}

const STATUS_CONFIG: Record<EnrollmentStatus, StatusConfig> = {
    ENROLLED: {
        label: 'Actif',
        variant: 'default',
        bgClass: 'bg-green-100 dark:bg-green-900/30',
        textClass: 'text-green-800 dark:text-green-300',
        Icon: Play,
    },
    PAUSED: {
        label: 'En pause',
        variant: 'secondary',
        bgClass: 'bg-amber-100 dark:bg-amber-900/30',
        textClass: 'text-amber-800 dark:text-amber-300',
        Icon: Pause,
    },
    STOPPED: {
        label: 'Arrêté',
        variant: 'destructive',
        bgClass: 'bg-red-100 dark:bg-red-900/30',
        textClass: 'text-red-800 dark:text-red-300',
        Icon: StopCircle,
    },
    COMPLETED: {
        label: 'Terminé',
        variant: 'outline',
        bgClass: 'bg-blue-100 dark:bg-blue-900/30',
        textClass: 'text-blue-800 dark:text-blue-300',
        Icon: CheckCircle,
    },
    REPLIED: {
        label: 'Répondu',
        variant: 'outline',
        bgClass: 'bg-teal-100 dark:bg-teal-900/30',
        textClass: 'text-teal-800 dark:text-teal-300',
        Icon: MessageCircle,
    },
};

// Special configs for campaign-level override states
const CAMPAIGN_PAUSED_CONFIG: StatusConfig = {
    label: 'Campagne en pause',
    variant: 'secondary',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-800 dark:text-amber-300',
    Icon: Pause,
};

const CAMPAIGN_STOPPED_CONFIG: StatusConfig = {
    label: 'Campagne arrêtée',
    variant: 'destructive',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-800 dark:text-red-300',
    Icon: StopCircle,
};

// Special config for duplicate prospects (same sequence in another active campaign)
const DUPLICATE_CONFIG: StatusConfig = {
    label: 'Doublon',
    variant: 'outline',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-600 dark:text-slate-400',
    Icon: Copy,
};

export function EnrollmentStatusBadge({
    status,
    enrolledAt,
    pausedAt,
    completedAt,
    className,
    campaignStatus,
    isDuplicate,
}: EnrollmentStatusBadgeProps) {
    // Determine effective display config based on campaign and enrollment status
    const getEffectiveConfig = (): StatusConfig => {
        // If prospect is a duplicate, show duplicate status first
        if (isDuplicate) {
            return DUPLICATE_CONFIG;
        }

        // If prospect has terminal statuses, always show those
        if (status === 'COMPLETED' || status === 'REPLIED' || status === 'STOPPED') {
            return STATUS_CONFIG[status];
        }

        // If prospect is explicitly PAUSED, show that
        if (status === 'PAUSED') {
            return STATUS_CONFIG['PAUSED'];
        }

        // For ENROLLED prospects, check campaign status
        if (status === 'ENROLLED') {
            if (campaignStatus === 'STOPPED') {
                return CAMPAIGN_STOPPED_CONFIG;
            }
            if (campaignStatus === 'PAUSED') {
                return CAMPAIGN_PAUSED_CONFIG;
            }
        }

        return STATUS_CONFIG[status];
    };

    const config = getEffectiveConfig();
    const Icon = config.Icon;

    // Determine appropriate tooltip content
    const getTooltipContent = () => {
        // Handle duplicate status first
        if (isDuplicate) {
            return 'Ce prospect est déjà dans une autre campagne active avec la même séquence. Aucun email ne sera envoyé pour éviter les doublons.';
        }

        // Handle campaign-level overrides
        if (status === 'ENROLLED' && campaignStatus === 'PAUSED') {
            return 'La campagne est en pause. Les envois reprendront quand la campagne sera relancée.';
        }
        if (status === 'ENROLLED' && campaignStatus === 'STOPPED') {
            return 'La campagne a été arrêtée. Les emails programmés ont été annulés.';
        }

        let timestamp: string | null = null;
        let label: string = '';

        switch (status) {
            case 'ENROLLED':
                timestamp = enrolledAt ?? null;
                label = 'Inscrit';
                break;
            case 'PAUSED':
                timestamp = pausedAt ?? null;
                label = 'Mis en pause';
                break;
            case 'STOPPED':
                timestamp = null;
                label = 'Arrêté';
                break;
            case 'COMPLETED':
                timestamp = completedAt ?? null;
                label = 'Terminé';
                break;
            case 'REPLIED':
                timestamp = null;
                label = 'A répondu';
                break;
        }

        if (timestamp) {
            return `${label} ${formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: fr,
            })}`;
        }

        return label;
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant={config.variant}
                    className={`${config.bgClass} ${config.textClass} border-0 font-medium gap-1.5 px-2.5 py-1 ${className ?? ''}`}
                >
                    <Icon className="h-3 w-3" />
                    {config.label}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <p>{getTooltipContent()}</p>
            </TooltipContent>
        </Tooltip>
    );
}

