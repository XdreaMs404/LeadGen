'use client';

import { Loader2, Check, X, AlertTriangle, Sparkles, Mail, Phone, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProspectStatus } from '@/types/prospect';

/**
 * Configuration for each prospect status badge
 * Story 3.4: Prospect List & Status Display with Filters
 * 
 * Premium design with gradient backgrounds and glow effects
 */
const STATUS_CONFIG: Record<ProspectStatus, {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    icon?: React.ReactNode;
}> = {
    NEW: {
        label: 'Nouveau',
        variant: 'secondary',
        className: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 shadow-sm',
        icon: <Sparkles className="h-3 w-3" />,
    },
    ENRICHING: {
        label: 'Enrichissement...',
        variant: 'outline',
        className: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-950 dark:to-indigo-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm shadow-blue-500/10',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    VERIFIED: {
        label: 'Vérifié',
        variant: 'default',
        className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-md shadow-emerald-500/25',
        icon: <Check className="h-3 w-3" />,
    },
    NOT_VERIFIED: {
        label: 'Non vérifié',
        variant: 'destructive',
        className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-md shadow-red-500/25',
        icon: <X className="h-3 w-3" />,
    },
    NEEDS_REVIEW: {
        label: 'À vérifier',
        variant: 'outline',
        className: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 dark:from-amber-950 dark:to-orange-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-500/10',
        icon: <AlertTriangle className="h-3 w-3" />,
    },
    SUPPRESSED: {
        label: 'Supprimé',
        variant: 'secondary',
        className: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 dark:from-gray-800 dark:to-gray-700 dark:text-gray-400 line-through opacity-60',
    },
    CONTACTED: {
        label: 'Contacté',
        variant: 'outline',
        className: 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 dark:from-purple-950 dark:to-violet-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm shadow-purple-500/10',
        icon: <Mail className="h-3 w-3" />,
    },
    REPLIED: {
        label: 'A répondu',
        variant: 'default',
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md shadow-green-500/25',
        icon: <Check className="h-3 w-3" />,
    },
    BOUNCED: {
        label: 'Rebond',
        variant: 'destructive',
        className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-md shadow-orange-500/25',
        icon: <X className="h-3 w-3" />,
    },
    UNSUBSCRIBED: {
        label: 'Désabonné',
        variant: 'secondary',
        className: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 border border-gray-300/50 dark:border-gray-600/50',
    },
    BOOKED: {
        label: 'RDV',
        variant: 'default',
        className: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-md shadow-indigo-500/25',
        icon: <Calendar className="h-3 w-3" />,
    },
};

interface ProspectStatusBadgeProps {
    status: ProspectStatus;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
}

/**
 * Premium color-coded badge component for prospect status display
 * Shows appropriate icon and styling with gradients and shadows
 */
export function ProspectStatusBadge({ status, className, size = 'default' }: ProspectStatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    if (!config) {
        return <Badge variant="secondary">{status}</Badge>;
    }

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
        default: 'text-xs px-2.5 py-1 gap-1',
        lg: 'text-sm px-3 py-1.5 gap-1.5',
    };

    return (
        <Badge
            variant={config.variant}
            className={cn(
                'font-medium transition-all duration-200 hover:scale-105',
                sizeClasses[size],
                config.className,
                className
            )}
        >
            {config.icon}
            {config.label}
        </Badge>
    );
}
