'use client';

import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Circle } from 'lucide-react';
import type { DnsStatus } from '@/types/dns';

interface DnsStatusBadgeProps {
    status: DnsStatus;
    className?: string;
}

const STATUS_CONFIG: Record<DnsStatus, {
    label: string;
    icon: typeof Check;
    colors: string;
}> = {
    NOT_STARTED: {
        label: 'Non vérifié',
        icon: Circle,
        colors: 'bg-gray-100 text-gray-600 border-gray-300',
    },
    PASS: {
        label: 'Configuré',
        icon: Check,
        colors: 'bg-green-100 text-green-700 border-green-300',
    },
    FAIL: {
        label: 'Non configuré',
        icon: X,
        colors: 'bg-red-100 text-red-700 border-red-300',
    },
    UNKNOWN: {
        label: 'En attente',
        icon: AlertTriangle,
        colors: 'bg-amber-100 text-amber-700 border-amber-300',
    },
    MANUAL_OVERRIDE: {
        label: 'Manuel',
        icon: Check,
        colors: 'bg-blue-100 text-blue-700 border-blue-300',
    },
};

/**
 * DnsStatusBadge - Displays the status of a DNS record configuration
 */
export function DnsStatusBadge({ status, className }: DnsStatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                config.colors,
                className
            )}
            data-testid={`dns-badge-${status.toLowerCase()}`}
        >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {config.label}
        </span>
    );
}
