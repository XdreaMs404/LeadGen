'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProspectCreateInputSchema, type ProspectCreateInput, SOURCE_OPTIONS } from '@/types/prospect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, User, Building2, Briefcase, Phone, Linkedin, Tag, FileText } from 'lucide-react';

interface ProspectFormProps {
    onSubmit: (data: ProspectCreateInput) => Promise<void>;
    isLoading: boolean;
    onCancel: () => void;
}

/**
 * Form component for creating a new prospect
 * Story 3.3: Manual Prospect Creation
 * Premium design with icons and refined styling
 */
export function ProspectForm({ onSubmit, isLoading, onCancel }: ProspectFormProps) {
    const form = useForm<ProspectCreateInput>({
        resolver: zodResolver(ProspectCreateInputSchema),
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            company: '',
            title: '',
            phone: '',
            linkedinUrl: '',
            source: 'OUTBOUND_RESEARCH',
            sourceDetail: '',
        },
    });

    const watchSource = form.watch('source');

    const handleSubmit = async (data: ProspectCreateInput) => {
        await onSubmit(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                {/* Email - required with icon */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-violet-500" />
                                Email <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="email@exemple.com"
                                    {...field}
                                    className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* First Name + Last Name row */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    Prénom
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Jean"
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    Nom
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Dupont"
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Company + Title row */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-teal-500" />
                                    Entreprise
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Acme Corp"
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-amber-500" />
                                    Poste
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="CEO"
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Phone + LinkedIn row */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-green-500" />
                                    Téléphone
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="+33 6 12 34 56 78"
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <Linkedin className="h-4 w-4 text-blue-600" />
                                    LinkedIn URL
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://linkedin.com/in/..."
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Source dropdown - required */}
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                <Tag className="h-4 w-4 text-purple-500" />
                                Source <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11">
                                        <SelectValue placeholder="Sélectionner une source" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    {SOURCE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="focus:bg-violet-50 dark:focus:bg-violet-900/20">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Conditional sourceDetail when source === 'OTHER' */}
                {watchSource === 'OTHER' && (
                    <FormField
                        control={form.control}
                        name="sourceDetail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    Détail source
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Précisez la source..."
                                        {...field}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20 h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Actions - Premium buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6"
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Ajout...
                            </>
                        ) : (
                            'Ajouter le prospect'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
