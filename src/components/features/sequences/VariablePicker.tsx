'use client';

/**
 * Variable Picker Component
 * Popover dropdown for selecting and inserting template variables into emails.
 * 
 * @component VariablePicker
 * @story 4.3 Template Variables System with Picker
 */

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Braces } from 'lucide-react';
import { TEMPLATE_VARIABLES } from '@/lib/constants/template-variables';
import { useState } from 'react';

export interface VariablePickerProps {
    /** Callback when a variable is selected for insertion */
    onInsert: (variable: string) => void;
    /** Whether the picker is disabled */
    disabled?: boolean;
}

/**
 * Renders a popover with available template variables.
 * When clicked, inserts the selected variable at the cursor position.
 */
export function VariablePicker({ onInsert, disabled = false }: VariablePickerProps) {
    const [open, setOpen] = useState(false);

    const handleInsert = (variableName: string) => {
        onInsert(`{{${variableName}}}`);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    title="Insérer une variable"
                    disabled={disabled}
                    aria-label="Insérer une variable de personnalisation"
                >
                    <Braces className="h-4 w-4" />
                    <span className="ml-1 text-xs">Variables</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground px-2 py-1">
                        Cliquez pour insérer
                    </p>
                    {TEMPLATE_VARIABLES.map((v) => (
                        <Button
                            key={v.name}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start font-mono text-sm"
                            onClick={() => handleInsert(v.name)}
                        >
                            <code className="text-teal-600 dark:text-teal-400">{`{{${v.name}}}`}</code>
                            <span className="ml-2 text-muted-foreground">{v.label}</span>
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
