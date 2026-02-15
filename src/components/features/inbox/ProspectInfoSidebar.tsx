'use client';

/**
 * Prospect Info Sidebar Component (Story 6.3 AC3)
 * 
 * Displays prospect and campaign context in conversation detail view:
 * - Prospect info: name, email, company, title
 * - Campaign info: name, status
 * - Quick links to prospect and campaign pages
 * - Placeholder for future reply button
 */

import Link from 'next/link';
import { User, Building2, Briefcase, Mail, ExternalLink, Rocket, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProspectInfoSidebarProps {
    prospect?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        title?: string | null;
    } | null;
    campaign?: {
        id: string;
        name: string;
        status?: string;
        sequence?: {
            id: string;
            name: string;
        } | null;
    } | null;
    enrollmentStatus?: string | null;
}

export function ProspectInfoSidebar({ prospect, campaign, enrollmentStatus }: ProspectInfoSidebarProps) {
    return (
        <div className="p-4 space-y-6">
            {/* Prospect Info */}
            <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Prospect
                </h3>
                <div className="space-y-3">
                    {prospect ? (
                        <>
                            <div className="flex items-start gap-2.5">
                                <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">
                                        {[prospect.firstName, prospect.lastName].filter(Boolean).join(' ') || 'Nom inconnu'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-600 break-all">{prospect.email}</p>
                            </div>
                            {prospect.company && (
                                <div className="flex items-start gap-2.5">
                                    <Building2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-slate-600">{prospect.company}</p>
                                </div>
                            )}
                            {prospect.title && (
                                <div className="flex items-start gap-2.5">
                                    <Briefcase className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-slate-600">{prospect.title}</p>
                                </div>
                            )}
                            <Link
                                href={`/prospects`}
                                className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 mt-2"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Voir les prospects
                            </Link>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">Prospect non lié</p>
                    )}
                </div>
            </div>

            {/* Campaign Info */}
            <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Campagne
                </h3>
                <div className="space-y-3">
                    {campaign ? (
                        <>
                            <div className="flex items-start gap-2.5">
                                <Rocket className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{campaign.name}</p>
                                    {campaign.status && (
                                        <p className="text-xs text-slate-500 capitalize">{campaign.status.toLowerCase()}</p>
                                    )}
                                    {campaign.sequence?.name && (
                                        <p className="text-xs text-slate-500">Séquence: {campaign.sequence.name}</p>
                                    )}
                                    {enrollmentStatus && (
                                        <p className="text-xs text-slate-500">Statut: {enrollmentStatus.toLowerCase()}</p>
                                    )}
                                </div>
                            </div>
                            <Link
                                href={`/campaigns/${campaign.id}`}
                                className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 mt-2"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Voir la campagne
                            </Link>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">Campagne non liée</p>
                    )}
                </div>
            </div>

            {/* Quick Actions placeholder for Story 6.7 */}
            <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Actions
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled
                    title="Disponible dans une prochaine version"
                >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Répondre
                    <span className="ml-auto text-xs text-slate-400">Bientôt</span>
                </Button>
            </div>
        </div>
    );
}
