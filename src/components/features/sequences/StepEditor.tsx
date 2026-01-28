'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Link as LinkIcon, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { VariablePicker } from './VariablePicker';
import { validateTemplateVariables } from '@/lib/template/variable-validator';
import { renderTemplate } from '@/lib/template/render-variables';
import { SAMPLE_PROSPECT } from '@/lib/template/sample-prospect';

interface StepEditorProps {
    subject: string;
    body: string;
    onSubjectChange: (subject: string) => void;
    onBodyChange: (body: string) => void;
    className?: string;
}

/**
 * Step Editor Component with Rich Text
 * Story 4.1 - Task 8, Story 4.3 - Variable picker, validation, preview
 * Uses Tiptap for rich text editing (bold, italic, links)
 */
export function StepEditor({
    subject,
    body,
    onSubjectChange,
    onBodyChange,
    className,
}: StepEditorProps) {
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [invalidVariables, setInvalidVariables] = useState<string[]>([]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-teal-600 underline hover:text-teal-700',
                },
            }),
        ],
        content: body,
        immediatelyRender: false, // Fix SSR hydration mismatch
        onUpdate: ({ editor }) => {
            onBodyChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
            },
        },
    });

    // Debounced validation for unknown variables
    useEffect(() => {
        const timer = setTimeout(() => {
            const contentToValidate = `${subject} ${body}`;
            const result = validateTemplateVariables(contentToValidate);
            setInvalidVariables(result.invalidVariables);
        }, 500);
        return () => clearTimeout(timer);
    }, [subject, body]);

    // Render preview with sample prospect
    const preview = useMemo(() => {
        if (!showPreview) return null;
        const subjectResult = renderTemplate(subject, SAMPLE_PROSPECT, { highlightMissing: true });
        const bodyResult = renderTemplate(body, SAMPLE_PROSPECT, { highlightMissing: true });
        return {
            subject: subjectResult,
            body: bodyResult,
            hasMissing: subjectResult.missingFields.length > 0 || bodyResult.missingFields.length > 0,
        };
    }, [showPreview, subject, body]);

    const setLink = useCallback(() => {
        if (!editor || !linkUrl) return;

        // Check if there's a selection
        const { from, to } = editor.state.selection;
        if (from === to) {
            // No selection, insert the URL as text with link
            editor
                .chain()
                .focus()
                .insertContent(`<a href="${linkUrl}">${linkUrl}</a>`)
                .run();
        } else {
            // Selection exists, wrap it in a link
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl })
                .run();
        }

        setLinkUrl('');
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    // Insert variable at cursor position
    const handleInsertVariable = useCallback((variable: string) => {
        if (!editor) return;

        editor
            .chain()
            .focus()
            .insertContent(variable)
            .run();
    }, [editor]);

    const wordCount = editor?.storage.characterCount?.words?.() ?? 0;
    const charCount = editor?.getText().length ?? 0;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Subject line */}
            <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                    Objet de l&apos;email
                </Label>
                <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    placeholder="Ex: Question rapide concernant {{company}}"
                    className="bg-white dark:bg-slate-800"
                />
            </div>

            {/* Rich text editor */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">
                    Contenu de l&apos;email
                </Label>
                <div className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b bg-slate-50 dark:bg-slate-900">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            className={cn(
                                'h-8 w-8 p-0',
                                editor?.isActive('bold') && 'bg-slate-200 dark:bg-slate-700'
                            )}
                            title="Gras (Ctrl+B)"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            className={cn(
                                'h-8 w-8 p-0',
                                editor?.isActive('italic') && 'bg-slate-200 dark:bg-slate-700'
                            )}
                            title="Italique (Ctrl+I)"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowLinkInput(!showLinkInput)}
                                className={cn(
                                    'h-8 w-8 p-0',
                                    editor?.isActive('link') && 'bg-slate-200 dark:bg-slate-700'
                                )}
                                title="Ajouter un lien"
                            >
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                            {showLinkInput && (
                                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-10 flex gap-2">
                                    <Input
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-48 h-8 text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                setLink();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={setLink}
                                        className="h-8"
                                    >
                                        OK
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1" />

                        {/* Variable Picker - Story 4.3 */}
                        <VariablePicker onInsert={handleInsertVariable} />

                        {/* Preview toggle - Story 4.3 */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className={cn(
                                showPreview && 'bg-slate-200 dark:bg-slate-700'
                            )}
                            title={showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}
                        >
                            {showPreview ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                            <span className="ml-1 text-xs">Aperçu</span>
                        </Button>
                    </div>

                    {/* Editor content or Preview */}
                    {showPreview && preview ? (
                        <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Eye className="h-3 w-3" />
                                Aperçu avec données d&apos;exemple
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 space-y-3">
                                <div>
                                    <span className="text-xs text-muted-foreground">Objet:</span>
                                    <div
                                        className="font-medium"
                                        dangerouslySetInnerHTML={{ __html: preview.subject.html }}
                                    />
                                </div>
                                <hr />
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: preview.body.html }}
                                />
                            </div>
                            {preview.hasMissing && (
                                <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                                        Certains champs sont vides pour les données d&apos;exemple. Les valeurs manquantes sont affichées en [vide].
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ) : (
                        <EditorContent editor={editor} />
                    )}

                    {/* Character/word count */}
                    <div className="flex justify-end gap-4 px-4 py-2 border-t bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground">
                        <span>{charCount} caractères</span>
                        <span>{wordCount} mots</span>
                    </div>
                </div>
            </div>

            {/* Unknown variable warnings - Story 4.3 */}
            {invalidVariables.length > 0 && (
                <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        {invalidVariables.map((v, i) => (
                            <span key={v}>
                                {i > 0 && ', '}
                                ⚠️ Variable inconnue: <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{v}</code>
                            </span>
                        ))}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
