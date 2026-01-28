'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelect } from '@/components/ui/multi-select';
import { Target, Loader2, Building2, Users, MapPin, Briefcase } from 'lucide-react';
import { useIcp, useUpdateIcp } from '@/hooks/use-icp';
import { IcpConfigInputSchema, COMPANY_SIZE_OPTIONS, type IcpConfigInput } from '@/types/icp';

const COMPANY_SIZE_OPTIONS_SELECT = COMPANY_SIZE_OPTIONS.map((size) => ({
    value: size,
    label: `${size} employés`,
}));

interface FormData {
    industries: string;
    companySizes: string[];
    roles: string;
    locations: string;
}

export function IcpSettings() {
    const { icpConfig, isLoading } = useIcp();
    const updateMutation = useUpdateIcp();

    const form = useForm<FormData>({
        defaultValues: {
            industries: '',
            companySizes: [],
            roles: '',
            locations: '',
        },
    });

    // Pre-fill form when ICP data loads
    useEffect(() => {
        if (icpConfig) {
            form.reset({
                industries: icpConfig.industries.join(', '),
                companySizes: icpConfig.companySizes,
                roles: icpConfig.roles.join(', '),
                locations: icpConfig.locations.join(', '),
            });
        }
    }, [icpConfig, form]);

    const onSubmit = (data: FormData) => {
        const parseList = (value: string): string[] =>
            value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

        const parsed = IcpConfigInputSchema.safeParse({
            industries: parseList(data.industries),
            companySizes: data.companySizes,
            roles: parseList(data.roles),
            locations: parseList(data.locations),
        });

        if (parsed.success) {
            updateMutation.mutate(parsed.data);
        }
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg shadow-slate-100">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg shadow-slate-100">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                        <Target className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Profil Client Idéal (ICP)</CardTitle>
                        <CardDescription>
                            Définissez les critères de vos prospects idéaux pour un ciblage optimal.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Industries */}
                    <div className="space-y-2">
                        <Label htmlFor="industries" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Secteurs d&apos;activité
                        </Label>
                        <Textarea
                            id="industries"
                            placeholder="Tech, SaaS, Fintech, E-commerce..."
                            className="min-h-[80px] resize-none"
                            {...form.register('industries')}
                        />
                        <p className="text-xs text-muted-foreground">
                            Séparez les secteurs par des virgules.
                        </p>
                    </div>

                    {/* Company Sizes */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Taille d&apos;entreprise
                        </Label>
                        <MultiSelect
                            options={COMPANY_SIZE_OPTIONS_SELECT}
                            selected={form.watch('companySizes')}
                            onChange={(values) => form.setValue('companySizes', values)}
                            placeholder="Sélectionnez les tailles..."
                        />
                    </div>

                    {/* Roles */}
                    <div className="space-y-2">
                        <Label htmlFor="roles" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            Fonctions / Titres
                        </Label>
                        <Textarea
                            id="roles"
                            placeholder="CEO, CTO, Head of Marketing, VP Sales..."
                            className="min-h-[80px] resize-none"
                            {...form.register('roles')}
                        />
                        <p className="text-xs text-muted-foreground">
                            Séparez les fonctions par des virgules.
                        </p>
                    </div>

                    {/* Locations */}
                    <div className="space-y-2">
                        <Label htmlFor="locations" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Localisations
                        </Label>
                        <Textarea
                            id="locations"
                            placeholder="France, Paris, Europe, USA..."
                            className="min-h-[80px] resize-none"
                            {...form.register('locations')}
                        />
                        <p className="text-xs text-muted-foreground">
                            Séparez les localisations par des virgules.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Sauvegarder'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
