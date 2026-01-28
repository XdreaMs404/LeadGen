/**
 * Validation Results Component
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ValidationError } from '@/types/prospect';
import { downloadErrorReport, getErrorSummary } from '@/lib/import/error-report';

interface ValidationResultsProps {
    validCount: number;
    errors: ValidationError[];
    duplicateCount: number;
}

export function ValidationResults({ validCount, errors, duplicateCount }: ValidationResultsProps) {
    const [showAllErrors, setShowAllErrors] = useState(false);
    const errorSummary = getErrorSummary(errors);

    const displayedErrors = showAllErrors ? errors : errors.slice(0, 10);
    const hasMoreErrors = errors.length > 10;

    const handleDownload = () => {
        downloadErrorReport(errors, `erreurs-import-${Date.now()}`);
    };

    return (
        <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Valides
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                            {validCount}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                            prospect{validCount > 1 ? 's' : ''} prêt{validCount > 1 ? 's' : ''} à importer
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Doublons
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                            {duplicateCount}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            seront ignoré{duplicateCount > 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Erreurs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                            {errorSummary.total - duplicateCount}
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400">
                            ligne{errorSummary.total - duplicateCount > 1 ? 's' : ''} invalide{errorSummary.total - duplicateCount > 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Error details */}
            {errors.length > 0 && (
                <Collapsible open={showAllErrors} onOpenChange={setShowAllErrors}>
                    <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <h3 className="font-medium">Détail des erreurs</h3>
                                <Badge variant="secondary">{errors.length}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Télécharger le rapport
                                </Button>
                                {hasMoreErrors && (
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="gap-1">
                                            {showAllErrors ? (
                                                <>
                                                    Réduire <ChevronUp className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    Voir tout <ChevronDown className="h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                )}
                            </div>
                        </div>

                        <div className="max-h-80 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Ligne</TableHead>
                                        <TableHead className="w-32">Colonne</TableHead>
                                        <TableHead>Erreur</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedErrors.map((error, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono text-sm">{error.rowNumber}</TableCell>
                                            <TableCell className="font-medium">{error.column}</TableCell>
                                            <TableCell className="text-muted-foreground">{error.error}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <CollapsibleContent>
                            {hasMoreErrors && (
                                <div className="max-h-60 overflow-auto border-t">
                                    <Table>
                                        <TableBody>
                                            {errors.slice(10).map((error, idx) => (
                                                <TableRow key={idx + 10}>
                                                    <TableCell className="font-mono text-sm w-20">{error.rowNumber}</TableCell>
                                                    <TableCell className="font-medium w-32">{error.column}</TableCell>
                                                    <TableCell className="text-muted-foreground">{error.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            )}
        </div>
    );
}
