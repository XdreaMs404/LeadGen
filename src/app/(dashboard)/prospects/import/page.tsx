/**
 * Prospect Import Page - Premium Design
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, MapPin, AlertTriangle, CheckCircle2, Loader2, Sparkles, FileText, ArrowRight, ArrowLeft, Users, HelpCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SourceSelector } from '@/components/features/prospects/SourceSelector';
import { ColumnMapper } from '@/components/features/prospects/ColumnMapper';
import { ValidationResults } from '@/components/features/prospects/ValidationResults';
import { useImportProspects } from '@/hooks/use-import-prospects';
import { parseCsvFile, CSV_MAX_FILE_SIZE_MB } from '@/lib/import/csv-parser';
import { previewValidation } from '@/lib/import/csv-validator';
import { useIcp } from '@/hooks/use-icp';
import { matchesIcp } from '@/lib/utils/icp-matcher';
import type { CsvParseResult, ProspectSource } from '@/types/prospect';

const STEPS = [
    { id: 1, title: 'Fichier', description: 'Chargez votre CSV', icon: Upload },
    { id: 2, title: 'Colonnes', description: 'Mappez les champs', icon: MapPin },
    { id: 3, title: 'Source', description: 'Origine des contacts', icon: FileSpreadsheet },
    { id: 4, title: 'Validation', description: 'Vérifiez les données', icon: AlertTriangle },
    { id: 5, title: 'Import', description: 'Confirmation', icon: CheckCircle2 },
];

export default function ImportPage() {
    const router = useRouter();
    const importMutation = useImportProspects();
    const { icpConfig } = useIcp();

    // Step state
    const [currentStep, setCurrentStep] = useState(1);

    // File state
    const [file, setFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Mapping state
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

    // Source state
    const [source, setSource] = useState<ProspectSource | ''>('');
    const [sourceDetail, setSourceDetail] = useState('');

    // ICP filter state
    const [showIcpOnly, setShowIcpOnly] = useState(false);

    // Validation state
    const [validationPreview, setValidationPreview] = useState<{ validCount: number; errorCount: number } | null>(null);

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setParseError(null);

        try {
            const result = await parseCsvFile(selectedFile);
            setParseResult(result);

            if (result.rows.length === 0) {
                setParseError('Le fichier CSV est vide');
                return;
            }

            setCurrentStep(2);
        } catch (error) {
            setParseError(error instanceof Error ? error.message : 'Erreur de parsing');
        }
    }, []);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
            handleFile(droppedFile);
        } else {
            setParseError('Veuillez déposer un fichier CSV');
        }
    }, [handleFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    // Handle mapping change
    const handleMappingChange = useCallback((mapping: Record<string, string>) => {
        setColumnMapping(mapping);
    }, []);

    // Handle source change
    const handleSourceChange = useCallback((newSource: ProspectSource, detail: string) => {
        setSource(newSource);
        setSourceDetail(detail);
    }, []);

    // Calculate validation preview when entering step 4
    const handleValidationStep = useCallback(() => {
        if (parseResult && Object.keys(columnMapping).length > 0) {
            const preview = previewValidation(parseResult.rows, columnMapping);
            setValidationPreview(preview);
            setCurrentStep(4);
        }
    }, [parseResult, columnMapping]);

    // Filter rows by ICP
    const filteredRows = useMemo(() => {
        if (!parseResult || !showIcpOnly || !icpConfig) {
            return parseResult?.rows || [];
        }

        return parseResult.rows.filter(row => {
            const prospectData = {
                company: row[Object.entries(columnMapping).find(([, v]) => v === 'company')?.[0] || ''] || '',
                title: row[Object.entries(columnMapping).find(([, v]) => v === 'title')?.[0] || ''] || '',
            };
            return matchesIcp(prospectData, icpConfig);
        });
    }, [parseResult, showIcpOnly, icpConfig, columnMapping]);

    // ICP match count
    const icpMatchCount = useMemo(() => {
        if (!parseResult || !icpConfig) return 0;
        return filteredRows.length;
    }, [filteredRows, parseResult, icpConfig]);

    // Execute import
    const handleImport = useCallback(async () => {
        if (!file || !source) return;

        try {
            await importMutation.mutateAsync({
                file,
                source,
                sourceDetail: sourceDetail || undefined,
                columnMapping,
            });
            setCurrentStep(5);
        } catch {
            // Error handled by mutation
        }
    }, [file, source, sourceDetail, columnMapping, importMutation]);

    // Navigation
    const canProceed = useMemo(() => {
        switch (currentStep) {
            case 1:
                return !!parseResult && !parseError;
            case 2:
                return !!columnMapping['email'] || Object.values(columnMapping).includes('email');
            case 3:
                return !!source;
            case 4:
                return (validationPreview?.validCount || 0) > 0;
            default:
                return false;
        }
    }, [currentStep, parseResult, parseError, columnMapping, source, validationPreview]);

    const handleNext = useCallback(() => {
        if (currentStep === 3) {
            handleValidationStep();
        } else if (currentStep === 4) {
            handleImport();
        } else if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    }, [currentStep, handleValidationStep, handleImport]);

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20">
                <div className="container max-w-5xl py-10 px-4 space-y-8">
                    {/* Header with gradient background */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-8 shadow-2xl shadow-teal-500/20">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" />

                        <div className="relative flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Importer des prospects
                                </h1>
                                <p className="text-teal-100 mt-1">
                                    Importez vos contacts CSV avec validation automatique et traçabilité complète
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Progress stepper - Premium */}
                    <div className="relative">
                        {/* Background progress bar */}
                        <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-12">
                            <div
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>

                        <div className="flex justify-between relative z-10">
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-2">
                                        <div
                                            className={cn(
                                                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg',
                                                isActive && 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white scale-110 shadow-teal-500/40',
                                                isCompleted && 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-500/30',
                                                !isActive && !isCompleted && 'bg-white dark:bg-slate-800 text-slate-400 shadow-slate-200/50 dark:shadow-slate-900/50'
                                            )}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-6 w-6" />
                                            ) : (
                                                <Icon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className={cn(
                                                'text-sm font-semibold block',
                                                isActive && 'text-teal-600 dark:text-teal-400',
                                                isCompleted && 'text-green-600 dark:text-green-400',
                                                !isActive && !isCompleted && 'text-slate-400'
                                            )}>
                                                {step.title}
                                            </span>
                                            <span className="text-xs text-slate-400 hidden md:block">
                                                {step.description}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step content card - Glassmorphism */}
                    <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-8">
                            {/* Step 1: File upload */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-2xl mb-4">
                                            <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            Sélectionnez votre fichier CSV
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                            Glissez-déposez votre fichier ou cliquez pour parcourir.
                                            Taille maximale : <span className="font-medium text-teal-600">{CSV_MAX_FILE_SIZE_MB} MB</span>
                                        </p>
                                    </div>

                                    <div
                                        className={cn(
                                            'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group',
                                            isDragging && 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 scale-[1.02]',
                                            !isDragging && 'border-slate-300 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                            file && 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                        )}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('file-input')?.click()}
                                    >
                                        <input
                                            id="file-input"
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            onChange={handleFileInput}
                                        />

                                        <div className={cn(
                                            'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300',
                                            file
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
                                                : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:from-teal-100 group-hover:to-emerald-100 dark:group-hover:from-teal-900/50 dark:group-hover:to-emerald-900/50'
                                        )}>
                                            {file ? (
                                                <CheckCircle2 className="h-10 w-10 text-white" />
                                            ) : (
                                                <Upload className={cn(
                                                    'h-10 w-10 transition-colors',
                                                    isDragging ? 'text-teal-500' : 'text-slate-400 group-hover:text-teal-500'
                                                )} />
                                            )}
                                        </div>

                                        {file ? (
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {(file.size / 1024).toFixed(1)} KB • Cliquez pour changer de fichier
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                                                    Déposez votre fichier CSV ici
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    ou <span className="text-teal-600 dark:text-teal-400 font-medium">cliquez pour parcourir</span>
                                                </p>
                                            </div>
                                        )}

                                        {/* Decorative elements */}
                                        <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-full blur-2xl" />
                                        <div className="absolute bottom-4 left-4 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-2xl" />
                                    </div>

                                    {parseError && (
                                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400">
                                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                            <span className="font-medium">{parseError}</span>
                                        </div>
                                    )}

                                    {/* Tips */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { icon: '📧', text: 'Colonne email obligatoire' },
                                            { icon: '🔤', text: 'Encodage UTF-8 recommandé' },
                                            { icon: '📊', text: 'Jusqu\'à 10 000 lignes' },
                                        ].map((tip, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <span className="text-xl">{tip.icon}</span>
                                                <span className="text-xs text-slate-600 dark:text-slate-400">{tip.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Column mapping */}
                            {currentStep === 2 && parseResult && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl mb-4">
                                            <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            Mappez vos colonnes
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                            Associez les colonnes de votre CSV aux champs prospect.
                                            L&apos;email est <span className="font-medium text-red-500">obligatoire</span>.
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                                        <ColumnMapper
                                            headers={parseResult.headers}
                                            rows={parseResult.rows}
                                            columnMapping={columnMapping}
                                            onChange={handleMappingChange}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Source selection */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl mb-4">
                                            <FileSpreadsheet className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            D&apos;où viennent ces contacts ?
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                            La traçabilité de vos sources est essentielle pour la conformité RGPD et la qualité de vos campagnes.
                                        </p>
                                    </div>

                                    <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                                        <SourceSelector
                                            value={source}
                                            sourceDetail={sourceDetail}
                                            onChange={handleSourceChange}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Validation */}
                            {currentStep === 4 && validationPreview && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-2xl mb-4">
                                            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            Résultats de validation
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                            Vérifiez les données avant l&apos;import. Les erreurs et doublons seront ignorés.
                                        </p>
                                    </div>

                                    {/* ICP filter toggle - Premium */}
                                    {icpConfig && parseResult && (
                                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                                                    <Target className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <label htmlFor="icp-filter" className="font-semibold text-slate-900 dark:text-white cursor-pointer">
                                                            Filtrer par ICP
                                                        </label>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button className="text-slate-400 hover:text-teal-500 transition-colors">
                                                                    <HelpCircle className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-xs p-4 bg-slate-900 text-white">
                                                                <div className="space-y-2">
                                                                    <p className="font-semibold">Qu&apos;est-ce que l&apos;ICP ?</p>
                                                                    <p className="text-sm text-slate-300">
                                                                        <strong>ICP</strong> signifie <strong>Ideal Customer Profile</strong> (Profil Client Idéal).
                                                                        C&apos;est la description de votre client cible parfait basée sur des critères comme
                                                                        l&apos;industrie, la taille d&apos;entreprise, le poste, etc.
                                                                    </p>
                                                                    <p className="text-xs text-teal-400">
                                                                        Configurez votre ICP dans Paramètres → ICP
                                                                    </p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <span className="text-sm text-slate-500">
                                                        Afficher uniquement les prospects correspondant à votre cible
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                                        {icpMatchCount}
                                                    </span>
                                                    <span className="text-slate-400">/{parseResult.rows.length}</span>
                                                    <p className="text-xs text-slate-500">correspondent</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        id="icp-filter"
                                                        checked={showIcpOnly}
                                                        onChange={(e) => setShowIcpOnly(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-emerald-500"></div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <ValidationResults
                                        validCount={showIcpOnly ? Math.min(validationPreview.validCount, icpMatchCount) : validationPreview.validCount}
                                        errors={[]}
                                        duplicateCount={0}
                                    />

                                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium">Information importante</p>
                                            <p className="text-amber-600 dark:text-amber-400">
                                                Les doublons avec les prospects existants dans votre base seront automatiquement ignorés lors de l&apos;import.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Success */}
                            {currentStep === 5 && (
                                <div className="text-center py-12 space-y-6">
                                    <div className="relative inline-block">
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
                                            <CheckCircle2 className="h-12 w-12 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                            Import terminé ! 🎉
                                        </h2>
                                        <p className="text-lg text-slate-500 dark:text-slate-400">
                                            Vos prospects ont été importés avec succès dans votre base.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => {
                                                setCurrentStep(1);
                                                setFile(null);
                                                setParseResult(null);
                                                setColumnMapping({});
                                                setSource('');
                                                setSourceDetail('');
                                            }}
                                            className="gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Nouvel import
                                        </Button>
                                        <Button
                                            size="lg"
                                            onClick={() => router.push('/prospects')}
                                            className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/30"
                                        >
                                            <Users className="h-4 w-4" />
                                            Voir les prospects
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Navigation buttons - Premium */}
                    {currentStep < 5 && (
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className="gap-2 px-6"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Button>

                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Sparkles className="h-4 w-4 text-teal-500" />
                                Étape {currentStep} sur {STEPS.length}
                            </div>

                            <Button
                                size="lg"
                                onClick={handleNext}
                                disabled={!canProceed || importMutation.isPending}
                                className={cn(
                                    'gap-2 px-6 transition-all duration-300',
                                    currentStep === 4
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                                        : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/30'
                                )}
                            >
                                {importMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Import en cours...
                                    </>
                                ) : (
                                    <>
                                        {currentStep === 4 ? 'Importer maintenant' : 'Continuer'}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Progress bar for import */}
                    {importMutation.isPending && (
                        <div className="space-y-2">
                            <Progress value={50} className="h-2 bg-slate-200 dark:bg-slate-800" />
                            <p className="text-center text-sm text-slate-500">
                                Import en cours, veuillez patienter...
                            </p>
                        </div>
                    )}

                    {/* ICP Info Note */}
                    {currentStep === 4 && (
                        <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                <HelpCircle className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                    À propos de l&apos;ICP (Ideal Customer Profile)
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    L&apos;<strong>ICP</strong> ou <strong>Profil Client Idéal</strong> représente les caractéristiques
                                    de vos clients cibles parfaits. En filtrant par ICP, vous ne conservez que les prospects
                                    qui correspondent à vos critères définis (secteur d&apos;activité, taille d&apos;entreprise, poste...).
                                    Cela améliore considérablement le taux de conversion de vos campagnes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
