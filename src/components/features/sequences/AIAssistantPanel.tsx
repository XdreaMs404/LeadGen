'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Wand2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAIAssistant } from '@/hooks/use-ai-assistant';

interface AIAssistantPanelProps {
    currentSubject: string;
    currentBody: string;
    onApply: (subject: string, body: string) => void;
}

type Mode = 'generate' | 'improve' | null;

/**
 * AI Email Assistant Panel
 * Story 4.4 - Generate emails from prompts or improve existing content
 * 
 * Displayed as a collapsible panel below the editor to avoid toolbar overflow.
 */
export function AIAssistantPanel({
    currentSubject,
    currentBody,
    onApply
}: AIAssistantPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [mode, setMode] = useState<Mode>(null);
    const [prompt, setPrompt] = useState('');
    const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

    const { generateEmail, improveEmail, isLoading, error, reset } = useAIAssistant();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        try {
            const result = await generateEmail(prompt);
            setPreview(result);
        } catch {
            // Error handled by hook
        }
    };

    const handleImprove = async () => {
        if (!currentSubject.trim() && !currentBody.trim()) return;

        try {
            const result = await improveEmail(currentSubject, currentBody);
            setPreview(result);
        } catch {
            // Error handled by hook
        }
    };

    const handleApply = () => {
        if (preview) {
            onApply(preview.subject, preview.body);
            setPreview(null);
            setPrompt('');
            setMode(null);
            setIsExpanded(false);
        }
    };

    const handleCancel = () => {
        setPreview(null);
        setPrompt('');
        setMode(null);
        reset();
    };

    // Check if improve mode can work
    const canImprove = currentSubject.trim().length > 0 || currentBody.trim().length > 10;

    return (
        <div className="border rounded-lg overflow-hidden bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
            {/* Header - always visible */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm text-violet-900 dark:text-violet-100">
                        Assistant IA
                    </span>
                    <span className="text-xs text-violet-600 dark:text-violet-400">
                        Générer ou améliorer votre email
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-violet-500" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-violet-500" />
                )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Mode selection */}
                    {!preview && (
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={mode === 'generate' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => { setMode('generate'); reset(); }}
                                className={cn(
                                    mode === 'generate' && 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                                )}
                            >
                                <Sparkles className="h-4 w-4 mr-1" />
                                Rédiger un email
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'improve' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => { setMode('improve'); reset(); }}
                                disabled={!canImprove}
                                className={cn(
                                    mode === 'improve' && 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                                )}
                                title={!canImprove ? "Écrivez d'abord du contenu à améliorer" : undefined}
                            >
                                <Wand2 className="h-4 w-4 mr-1" />
                                Améliorer ce texte
                            </Button>
                        </div>
                    )}

                    {/* Generate mode - prompt input */}
                    {mode === 'generate' && !preview && (
                        <div className="space-y-3">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Décrivez le mail que vous voulez...&#10;&#10;Ex: Un email de prospection pour proposer nos services RH à des PME, ton professionnel mais chaleureux"
                                className="min-h-[100px] bg-white dark:bg-slate-800 resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || isLoading}
                                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Génération...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-1" />
                                            Générer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Improve mode - confirmation */}
                    {mode === 'improve' && !preview && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                L&apos;IA va reformuler votre email pour le rendre plus percutant et professionnel.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleImprove}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Amélioration...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="h-4 w-4 mr-1" />
                                            Améliorer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Preview result */}
                    {preview && (
                        <div className="space-y-3">
                            <div className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Résultat généré par l&apos;IA - Vérifiez avant d&apos;appliquer
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 space-y-3">
                                <div>
                                    <span className="text-xs text-muted-foreground">Objet:</span>
                                    <div className="font-medium">{preview.subject}</div>
                                </div>
                                <hr />
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: preview.body }}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleApply}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                >
                                    ✓ Appliquer
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Error display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error}
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => mode === 'generate' ? handleGenerate() : handleImprove()}
                                    className="ml-2 p-0 h-auto"
                                >
                                    Réessayer
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
}
