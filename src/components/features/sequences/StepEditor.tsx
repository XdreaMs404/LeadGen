'use client';

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

interface StepEditorProps {
    subject: string;
    body: string;
    onSubjectChange: (subject: string) => void;
    onBodyChange: (body: string) => void;
    className?: string;
}

/**
 * Step Editor Component with Rich Text
 * Story 4.1 - Task 8
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

                        {/* Variable placeholder slot - future story 4.3 */}
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            Variables: bientôt disponible
                        </div>
                    </div>

                    {/* Editor content */}
                    <EditorContent editor={editor} />

                    {/* Character/word count */}
                    <div className="flex justify-end gap-4 px-4 py-2 border-t bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground">
                        <span>{charCount} caractères</span>
                        <span>{wordCount} mots</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
