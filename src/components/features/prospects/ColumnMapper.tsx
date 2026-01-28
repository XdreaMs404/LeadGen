/**
 * Column Mapper Component
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
'use client';

import { useEffect, useMemo } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { autoMapColumnName } from '@/types/prospect';

const PROSPECT_FIELDS = [
    { key: 'email', label: 'Email', required: true },
    { key: 'firstName', label: 'Prénom', required: false },
    { key: 'lastName', label: 'Nom', required: false },
    { key: 'company', label: 'Entreprise', required: false },
    { key: 'title', label: 'Poste', required: false },
    { key: 'phone', label: 'Téléphone', required: false },
    { key: 'linkedinUrl', label: 'LinkedIn URL', required: false },
] as const;

interface ColumnMapperProps {
    headers: string[];
    rows: Record<string, string>[];
    columnMapping: Record<string, string>;
    onChange: (mapping: Record<string, string>) => void;
}

export function ColumnMapper({ headers, rows, columnMapping, onChange }: ColumnMapperProps) {
    // Auto-map columns on mount
    useEffect(() => {
        const autoMapping: Record<string, string> = {};
        for (const header of headers) {
            const mapped = autoMapColumnName(header);
            if (mapped) {
                autoMapping[header] = mapped;
            }
        }
        // Only set if empty
        if (Object.keys(columnMapping).length === 0 && Object.keys(autoMapping).length > 0) {
            onChange(autoMapping);
        }
    }, [headers, columnMapping, onChange]);

    const handleMappingChange = (csvColumn: string, prospectField: string) => {
        const newMapping = { ...columnMapping };
        if (prospectField === '__none__') {
            delete newMapping[csvColumn];
        } else {
            // Remove any existing mapping for this prospect field
            for (const key of Object.keys(newMapping)) {
                if (newMapping[key] === prospectField) {
                    delete newMapping[key];
                }
            }
            newMapping[csvColumn] = prospectField;
        }
        onChange(newMapping);
    };

    // Reverse mapping for display
    const reverseMapping = useMemo(() => {
        const reverse: Record<string, string> = {};
        for (const [csv, prospect] of Object.entries(columnMapping)) {
            reverse[prospect] = csv;
        }
        return reverse;
    }, [columnMapping]);

    // Check if email is mapped
    const emailMapped = !!reverseMapping['email'];

    // Preview first 5 rows
    const previewRows = rows.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Mapping interface */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Correspondance des colonnes</Label>
                    {!emailMapped && (
                        <Badge variant="destructive" className="text-xs">
                            Email requis
                        </Badge>
                    )}
                </div>

                <div className="grid gap-3">
                    {PROSPECT_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-medium flex items-center gap-1">
                                {field.label}
                                {field.required && <span className="text-destructive">*</span>}
                            </div>
                            <Select
                                value={reverseMapping[field.key] || '__none__'}
                                onValueChange={(value) => {
                                    // Find the CSV column that was selected and map it
                                    if (value !== '__none__') {
                                        handleMappingChange(value, field.key);
                                    } else {
                                        // Remove existing mapping
                                        const existingCsv = reverseMapping[field.key];
                                        if (existingCsv) {
                                            const newMapping = { ...columnMapping };
                                            delete newMapping[existingCsv];
                                            onChange(newMapping);
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Non mappé" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">
                                        <span className="text-muted-foreground">Non mappé</span>
                                    </SelectItem>
                                    {headers.map((header) => (
                                        <SelectItem key={header} value={header}>
                                            {header}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>

            {/* Preview table */}
            <div className="space-y-2">
                <Label className="text-base font-medium">Aperçu des données (5 premières lignes)</Label>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                {PROSPECT_FIELDS.map((field) => (
                                    <TableHead key={field.key} className="text-xs font-medium">
                                        {field.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {previewRows.map((row, idx) => (
                                <TableRow key={idx}>
                                    {PROSPECT_FIELDS.map((field) => {
                                        const csvColumn = reverseMapping[field.key];
                                        const value = csvColumn ? row[csvColumn] : '';
                                        return (
                                            <TableCell key={field.key} className="text-sm truncate max-w-[150px]">
                                                {value || <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
