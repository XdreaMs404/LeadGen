'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    User,
    Building2,
    Briefcase,
    Phone,
    Linkedin,
    Calendar,
    FileText,
    Mail,
    Globe,
    Sparkles,
    Edit3,
    Trash2,
    Zap,
    Clock,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ProspectStatusBadge } from './ProspectStatusBadge';
import { SOURCE_OPTIONS } from '@/types/prospect';
import type { Prospect } from '@/types/prospect';
import { cn } from '@/lib/utils';
import { useReEnrich } from '@/hooks/use-enrichment';
import { useWorkspace } from '@/hooks/use-workspace';

interface ProspectDetailSheetProps {
    prospect: Prospect | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Get French label for source
 */
function getSourceLabel(source: string): string {
    const option = SOURCE_OPTIONS.find(o => o.value === source);
    return option?.label ?? source;
}

/**
 * Get initials from name
 */
function getInitials(firstName: string | null, lastName: string | null): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
}

/**
 * Premium detail field display component
 */
function DetailField({
    icon: Icon,
    label,
    value,
    href,
    className,
}: {
    icon: React.ElementType;
    label: string;
    value: string | null | undefined;
    href?: string;
    className?: string;
}) {
    if (!value) return null;

    const content = href ? (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 group"
        >
            {value}
            <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </a>
    ) : (
        <span className="text-foreground font-medium">{value}</span>
    );

    return (
        <div className={cn("flex items-start gap-4 py-3 group", className)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0 group-hover:from-violet-100 group-hover:to-purple-100 dark:group-hover:from-violet-900/50 dark:group-hover:to-purple-900/50 transition-colors">
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                {content}
            </div>
        </div>
    );
}

/**
 * ProspectDetailSheet component with premium design
 * Story 3.4: Prospect List & Status Display with Filters (AC5)
 * Story 3.5: Enrichment display (AC4, AC6, AC8)
 */
export function ProspectDetailSheet({
    prospect,
    open,
    onOpenChange,
}: ProspectDetailSheetProps) {
    const { workspaceId } = useWorkspace();
    const reEnrich = useReEnrich(workspaceId || '');
    const [isReEnriching, setIsReEnriching] = useState(false);

    if (!prospect) return null;

    const fullName = [prospect.firstName, prospect.lastName].filter(Boolean).join(' ');
    const initials = getInitials(prospect.firstName, prospect.lastName);

    // Check if re-enrichment is allowed
    const canReEnrich = ['NEEDS_REVIEW', 'NOT_VERIFIED'].includes(prospect.status);
    const isVerified = prospect.status === 'VERIFIED';

    // Handle re-enrich button click
    const handleReEnrich = async () => {
        if (!canReEnrich) return;
        setIsReEnriching(true);
        try {
            await reEnrich.mutateAsync(prospect.id);
        } finally {
            setIsReEnriching(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0 bg-gradient-to-br from-white via-slate-50/50 to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
                {/* Premium Header */}
                <div className="relative">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 h-32" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 h-32" />

                    <SheetHeader className="relative pt-6 px-6 pb-16">
                        <div className="flex items-center justify-between">
                            <ProspectStatusBadge status={prospect.status} size="lg" />
                        </div>
                    </SheetHeader>

                    {/* Avatar overlapping header */}
                    <div className="absolute -bottom-10 left-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-violet-500/30 border-4 border-white dark:border-slate-900">
                                {initials}
                            </div>
                            {isVerified && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                </div>
                            )}
                            {!isVerified && prospect.enrichmentSource && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                                    <AlertCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                            )}
                            {!prospect.enrichmentSource && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-400 rounded-lg flex items-center justify-center shadow-lg">
                                    <Sparkles className="h-3.5 w-3.5 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-14 px-6 pb-6 space-y-6">
                    {/* Name & Email section */}
                    <div>
                        <SheetTitle className="text-2xl font-bold text-foreground">
                            {fullName || 'Prospect sans nom'}
                        </SheetTitle>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="text-base">{prospect.email}</span>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Contact Information */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                            <User className="h-4 w-4" />
                            INFORMATIONS DE CONTACT
                        </h3>
                        <div className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-border/50 divide-y divide-border/30 shadow-sm">
                            <DetailField
                                icon={Building2}
                                label="Entreprise"
                                value={prospect.company}
                                className="px-4"
                            />
                            <DetailField
                                icon={Briefcase}
                                label="Poste"
                                value={prospect.title}
                                className="px-4"
                            />
                            <DetailField
                                icon={Phone}
                                label="Téléphone"
                                value={prospect.phone}
                                className="px-4"
                            />
                            <DetailField
                                icon={Linkedin}
                                label="LinkedIn"
                                value={prospect.linkedinUrl ? 'Voir le profil' : null}
                                href={prospect.linkedinUrl ?? undefined}
                                className="px-4"
                            />
                        </div>
                    </section>

                    {/* Provenance Information */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                            <Globe className="h-4 w-4" />
                            PROVENANCE
                        </h3>
                        <div className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-border/50 divide-y divide-border/30 shadow-sm">
                            <DetailField
                                icon={FileText}
                                label="Source"
                                value={getSourceLabel(prospect.source)}
                                className="px-4"
                            />
                            {prospect.sourceDetail && (
                                <DetailField
                                    icon={FileText}
                                    label="Détail source"
                                    value={prospect.sourceDetail}
                                    className="px-4"
                                />
                            )}
                            <DetailField
                                icon={Calendar}
                                label="Créé le"
                                value={format(new Date(prospect.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                className="px-4"
                            />
                            <DetailField
                                icon={Clock}
                                label="Mis à jour"
                                value={format(new Date(prospect.updatedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                className="px-4"
                            />
                        </div>
                    </section>

                    {/* Enrichment Section (Story 3.5 - AC4, AC6) */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                            <Zap className="h-4 w-4" />
                            ENRICHISSEMENT
                        </h3>

                        {/* Verified Badge (AC4) */}
                        {isVerified && prospect.enrichmentSource && (
                            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border border-emerald-200/50 dark:border-emerald-800/50 p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                            ✓ Vérifié par Dropcontact
                                        </p>
                                        {prospect.enrichedAt && (
                                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                                {format(new Date(prospect.enrichedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enrichment Details (AC6) */}
                        <div className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-border/50 divide-y divide-border/30 shadow-sm">
                            <DetailField
                                icon={Sparkles}
                                label="Source d'enrichissement"
                                value={prospect.enrichmentSource || 'Non enrichi'}
                                className="px-4"
                            />
                            {prospect.enrichedAt && (
                                <DetailField
                                    icon={Calendar}
                                    label="Date de vérification"
                                    value={format(new Date(prospect.enrichedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                    className="px-4"
                                />
                            )}
                        </div>

                        {/* Re-Enrich Button (AC8) */}
                        {canReEnrich && (
                            <Button
                                className="w-full mt-4 gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                                onClick={handleReEnrich}
                                disabled={isReEnriching}
                            >
                                {isReEnriching ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Relance en cours...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        Relancer l&apos;enrichissement
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Not yet enriched message */}
                        {!prospect.enrichmentSource && prospect.status === 'NEW' && (
                            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200/50 dark:border-blue-800/50 p-4 mt-4 text-center">
                                <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    Enrichissement en attente
                                </p>
                                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                                    Ce prospect sera enrichi automatiquement
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Actions */}
                    <section className="pt-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 bg-white/60 dark:bg-slate-900/60 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600 hover:border-violet-200 transition-all"
                                disabled
                            >
                                <Edit3 className="h-4 w-4" />
                                Modifier
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 bg-white/60 dark:bg-slate-900/60 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600 hover:border-violet-200 transition-all"
                                disabled
                            >
                                <Zap className="h-4 w-4" />
                                Enrichir
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 bg-white/60 dark:bg-slate-900/60 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 hover:border-red-200 transition-all"
                                disabled
                            >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-3">
                            Ces actions seront disponibles dans une prochaine version
                        </p>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}

