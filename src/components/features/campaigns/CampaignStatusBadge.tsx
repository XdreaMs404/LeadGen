'use client';

/**
 * Campaign Status Badge Component
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * 
 * Color-coded status badge with optional tooltip showing timestamps
 */

import { CampaignStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pause, Play, Square, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignStatusBadgeProps {
    status: CampaignStatus;
    startedAt?: string | null;
    pausedAt?: string | null;
    stoppedAt?: string | null;
    completedAt?: string | null;
    className?: string;
}

const STATUS_CONFIG: Record<CampaignStatus, {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    Icon: typeof Play;
}> = {
    DRAFT: {
        label: 'Brouillon',
        variant: 'secondary',
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
        Icon: FileText,
    },
    RUNNING: {
        label: 'En cours',
        variant: 'default',
        className: 'bg-green-100 text-green-700 hover:bg-green-100 animate-pulse',
        Icon: Play,
    },
    PAUSED: {
        label: 'En pause',
        variant: 'secondary',
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
        Icon: Pause,
    },
    STOPPED: {
        label: 'Arrêtée',
        variant: 'destructive',
        className: 'bg-red-100 text-red-700 hover:bg-red-100',
        Icon: Square,
    },
    COMPLETED: {
        label: 'Terminée',
        variant: 'default',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
        Icon: CheckCircle,
    },
};

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function CampaignStatusBadge({
    status,
    startedAt,
    pausedAt,
    stoppedAt,
    completedAt,
    className,
}: CampaignStatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const { label, Icon } = config;

    // Determine which timestamp to show
    let timestamp: string | null = null;
    let timestampLabel = '';

    switch (status) {
        case 'RUNNING':
            if (startedAt) {
                timestamp = startedAt;
                timestampLabel = 'Démarré le';
            }
            break;
        case 'PAUSED':
            if (pausedAt) {
                timestamp = pausedAt;
                timestampLabel = 'Mis en pause le';
            }
            break;
        case 'STOPPED':
            if (stoppedAt) {
                timestamp = stoppedAt;
                timestampLabel = 'Arrêté le';
            }
            break;
        case 'COMPLETED':
            if (completedAt) {
                timestamp = completedAt;
                timestampLabel = 'Terminé le';
            }
            break;
    }

    const badge = (
        <Badge
            variant={config.variant}
            className={cn(config.className, 'gap-1', className)}
        >
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );

    // If we have a timestamp, wrap in tooltip
    if (timestamp) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {badge}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{timestampLabel} {formatDate(timestamp)}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return badge;
}
