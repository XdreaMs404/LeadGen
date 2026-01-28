/**
 * Source Selector Component
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SOURCE_OPTIONS, isRiskySource, type ProspectSource } from '@/types/prospect';

interface SourceSelectorProps {
    value: ProspectSource | '';
    sourceDetail: string;
    onChange: (source: ProspectSource, detail: string) => void;
}

export function SourceSelector({ value, sourceDetail, onChange }: SourceSelectorProps) {
    const [showRiskyWarning, setShowRiskyWarning] = useState(false);

    useEffect(() => {
        if (sourceDetail) {
            setShowRiskyWarning(isRiskySource(sourceDetail));
        } else {
            setShowRiskyWarning(false);
        }
    }, [sourceDetail]);

    const handleSourceChange = (newSource: ProspectSource) => {
        onChange(newSource, sourceDetail);
    };

    const handleDetailChange = (newDetail: string) => {
        onChange(value as ProspectSource, newDetail);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-medium">
                    Source des prospects <span className="text-destructive">*</span>
                </Label>
                <Select value={value} onValueChange={handleSourceChange}>
                    <SelectTrigger id="source" className="w-full">
                        <SelectValue placeholder="Sélectionnez une source" />
                    </SelectTrigger>
                    <SelectContent>
                        {SOURCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Indiquez comment vous avez obtenu ces contacts pour assurer la traçabilité.
                </p>
            </div>

            {value === 'OTHER' && (
                <div className="space-y-2">
                    <Label htmlFor="sourceDetail" className="text-sm font-medium">
                        Précisez la source
                    </Label>
                    <Input
                        id="sourceDetail"
                        value={sourceDetail}
                        onChange={(e) => handleDetailChange(e.target.value)}
                        placeholder="Ex: Salon Tech Paris 2026, Webinar..."
                        className="w-full"
                    />
                </div>
            )}

            {showRiskyWarning && (
                <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        ⚠️ Les listes achetées peuvent avoir des problèmes de délivrabilité.
                        Assurez-vous d&apos;avoir le consentement des contacts.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
