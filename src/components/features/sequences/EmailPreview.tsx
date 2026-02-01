'use client';

/**
 * EmailPreview Component
 * Story 4.5: Copilot Email Preview (Mandatory)
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 1: Create EmailPreview Component
 * Task 6: Integrate Spam Analysis in EmailPreview
 *
 * Displays a single email preview with:
 * - Subject line with rendered variables
 * - Email body with proper HTML rendering
 * - Recipient info (name, email, company)
 * - Warning badges for missing variables
 * - Spam risk badge and warnings panel (Story 4.6)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Building2, Mail } from 'lucide-react';
import type { PreviewProspect, PreviewRenderResult } from '@/lib/sequences/preview-renderer';
import type { SpamAnalysisResult } from '@/lib/sequences/spam-analyzer';
import { SpamRiskBadge } from './SpamRiskBadge';
import { SpamWarningsPanel } from './SpamWarningsPanel';
import { cn } from '@/lib/utils';

interface EmailPreviewProps {
    /** Rendered subject line result */
    subject: PreviewRenderResult;
    /** Rendered body result */
    body: PreviewRenderResult;
    /** The prospect data being previewed */
    prospect: PreviewProspect;
    /** Current sample number (1-indexed) */
    sampleNumber: number;
    /** Total samples */
    totalSamples: number;
    /** Step number for display */
    stepNumber: number;
    /** Optional delay days before this step */
    delayDays?: number;
    /** Story 4.6: Spam analysis result for this email */
    spamAnalysis?: SpamAnalysisResult;
}

/**
 * EmailPreview - Displays a complete email preview for Copilot mode
 */
export function EmailPreview({
    subject,
    body,
    prospect,
    sampleNumber,
    totalSamples,
    stepNumber,
    delayDays,
    spamAnalysis,
}: EmailPreviewProps) {
    const [isSpamPanelExpanded, setIsSpamPanelExpanded] = useState(false);

    const hasVariableWarnings = subject.missingVariables.length > 0 || body.missingVariables.length > 0;
    const allMissingVariables = [
        ...new Set([...subject.missingVariables, ...body.missingVariables]),
    ];

    return (
        <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden">
            {/* Premium gradient header */}
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-b border-slate-100 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Step badge */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-md">
                            {stepNumber}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-teal-700 dark:text-teal-300">
                                Étape {stepNumber}
                            </div>
                            {delayDays !== undefined && delayDays > 0 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Envoi après {delayDays} jour{delayDays > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sample indicator */}
                        <Badge variant="outline" className="font-normal">
                            Aperçu {sampleNumber} / {totalSamples}
                        </Badge>

                        {/* Warning badge for missing variables */}
                        {hasVariableWarnings && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {allMissingVariables.length} variable{allMissingVariables.length > 1 ? 's' : ''} manquante{allMissingVariables.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Recipient info */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">
                                {prospect.firstName || ''} {prospect.lastName || ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Mail className="h-4 w-4" />
                            <span>{prospect.email}</span>
                        </div>
                        {prospect.company && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <Building2 className="h-4 w-4" />
                                <span>{prospect.company}</span>
                                {prospect.title && (
                                    <span className="text-slate-400">• {prospect.title}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Story 4.6: Spam Risk Badge */}
                    {spamAnalysis && (
                        <div className="mt-3 flex items-start gap-2">
                            <SpamRiskBadge
                                riskLevel={spamAnalysis.riskLevel}
                                score={spamAnalysis.score}
                                warnings={spamAnalysis.warnings}
                                isExpanded={isSpamPanelExpanded}
                                onToggleExpand={() => setIsSpamPanelExpanded(!isSpamPanelExpanded)}
                            />
                        </div>
                    )}

                    {/* Story 4.6: Spam Warnings Panel */}
                    {spamAnalysis && (
                        <SpamWarningsPanel
                            warnings={spamAnalysis.warnings}
                            isExpanded={isSpamPanelExpanded}
                        />
                    )}
                </div>

                {/* Subject line */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Objet :
                        </span>
                        <span className={cn(
                            "font-medium text-slate-900 dark:text-white",
                            subject.missingVariables.length > 0 && "text-amber-600 dark:text-amber-400"
                        )}>
                            {subject.rendered || '(Sans objet)'}
                        </span>
                    </div>
                </div>

                {/* Email body */}
                <div className="p-4">
                    <div
                        className={cn(
                            "prose prose-sm dark:prose-invert max-w-none",
                            "prose-p:my-2 prose-p:leading-relaxed",
                            "prose-a:text-teal-600 dark:prose-a:text-teal-400",
                            body.missingVariables.length > 0 && "prose-p:text-amber-600 dark:prose-p:text-amber-400"
                        )}
                        dangerouslySetInnerHTML={{
                            __html: (body.rendered || '<p><em>Contenu vide...</em></p>')
                                // TODO: Install and use DOMPurify when npm auth is fixed
                                // Basic sanitization to prevent simple XSS
                                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                                .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
                                .replace(/\bon\w+="[^"]*"/gim, "")
                                .replace(/href=["']javascript:[^"']*["']/gim, "")
                        }}
                    />
                </div>

                {/* Missing variables warning detail */}
                {hasVariableWarnings && (
                    <div className="px-4 pb-4">
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium text-amber-700 dark:text-amber-300">
                                    Variables non renseignées :
                                </span>
                                <span className="text-amber-600 dark:text-amber-400 ml-1">
                                    {allMissingVariables.map(v => `{{${v}}}`).join(', ')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

