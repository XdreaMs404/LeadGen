'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Clock, Calendar, Mail, Zap, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSendingSettings, useUpdateSendingSettings } from '@/hooks/use-settings';
import { COMMON_TIMEZONES, DAY_NAMES, DEFAULT_SENDING_SETTINGS } from '@/types/sending-settings';
import { getBrowserTimezone, formatHourRange } from '@/lib/utils/sending-window';

/**
 * SendingSettingsForm Component
 * Story 5.3: Sending Settings Configuration
 */
export function SendingSettingsForm() {
    const { data: settings, isLoading, isError } = useSendingSettings();
    const updateSettings = useUpdateSendingSettings();

    // Local form state
    const [sendingDays, setSendingDays] = useState<number[]>(DEFAULT_SENDING_SETTINGS.sendingDays);
    const [startHour, setStartHour] = useState(DEFAULT_SENDING_SETTINGS.startHour);
    const [endHour, setEndHour] = useState(DEFAULT_SENDING_SETTINGS.endHour);
    const [timezone, setTimezone] = useState(getBrowserTimezone());
    const [dailyQuota, setDailyQuota] = useState(DEFAULT_SENDING_SETTINGS.dailyQuota);
    const [rampUpEnabled, setRampUpEnabled] = useState(DEFAULT_SENDING_SETTINGS.rampUpEnabled);
    const [fromName, setFromName] = useState('');
    const [signature, setSignature] = useState('');

    // Sync form state with loaded settings
    useEffect(() => {
        if (settings) {
            setSendingDays(settings.sendingDays);
            setStartHour(settings.startHour);
            setEndHour(settings.endHour);
            setTimezone(settings.timezone);
            setDailyQuota(settings.dailyQuota);
            setRampUpEnabled(settings.rampUpEnabled);
            setFromName(settings.fromName || '');
            setSignature(settings.signature || '');
        }
    }, [settings]);

    const toggleDay = (day: number) => {
        setSendingDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        updateSettings.mutate({
            sendingDays,
            startHour,
            endHour,
            timezone,
            dailyQuota,
            rampUpEnabled,
            fromName: fromName || undefined,
            signature: signature || undefined,
        });
    };

    if (isLoading) {
        return <SendingSettingsFormSkeleton />;
    }

    if (isError) {
        return (
            <Card className="border-0 shadow-lg shadow-slate-100">
                <CardContent className="p-6">
                    <p className="text-red-600">Erreur lors du chargement des paramètres</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sending Window Card */}
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Fenêtre d&apos;envoi</CardTitle>
                                <CardDescription>Définissez quand vos emails peuvent être envoyés</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Days Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Jours d&apos;envoi
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {([1, 2, 3, 4, 5, 6, 0] as const).map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`
                                            px-4 py-2 rounded-lg font-medium transition-all duration-200
                                            ${sendingDays.includes(day)
                                                ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }
                                        `}
                                    >
                                        {DAY_NAMES[day]}
                                    </button>
                                ))}
                            </div>
                            {sendingDays.length === 0 && (
                                <p className="text-sm text-red-500">Sélectionnez au moins un jour</p>
                            )}
                        </div>

                        {/* Hours Range */}
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Heures d&apos;envoi
                            </Label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">De {startHour}h à {endHour}h</span>
                                    <span className="text-sm font-medium bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                                        {formatHourRange(startHour, endHour)}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground w-16">Début</span>
                                        <Slider
                                            value={[startHour]}
                                            onValueChange={([value]) => {
                                                if (value < endHour) setStartHour(value);
                                            }}
                                            min={0}
                                            max={23}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium w-12 text-right">{startHour}h</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground w-16">Fin</span>
                                        <Slider
                                            value={[endHour]}
                                            onValueChange={([value]) => {
                                                if (value > startHour) setEndHour(value);
                                            }}
                                            min={0}
                                            max={23}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium w-12 text-right">{endHour}h</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timezone */}
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Fuseau horaire</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger id="timezone" className="w-full">
                                    <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMON_TIMEZONES.map(tz => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Quota & Ramp-up Card */}
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Quota quotidien</CardTitle>
                                <CardDescription>Contrôlez le volume d&apos;envoi journalier</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Daily Quota Slider */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Limite quotidienne</Label>
                                <span className="text-lg font-bold text-blue-600">{dailyQuota} emails</span>
                            </div>
                            <Slider
                                value={[dailyQuota]}
                                onValueChange={([value]) => setDailyQuota(value)}
                                min={20}
                                max={50}
                                step={5}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>20</span>
                                <span>30</span>
                                <span>40</span>
                                <span>50</span>
                            </div>
                        </div>

                        {/* Ramp-up Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="font-medium">Montée en puissance progressive</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Jour 1: 20 emails, Jour 2: 30 emails, Jour 3: 40 emails, puis le quota configuré.</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Recommandé pour protéger la délivrabilité.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Switch
                                checked={rampUpEnabled}
                                onCheckedChange={setRampUpEnabled}
                            />
                        </div>

                        {rampUpEnabled && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-sm text-blue-800">
                                    <strong>Montée progressive activée:</strong> Jour 1 → 20 emails, Jour 2 → 30 emails,
                                    Jour 3 → 40 emails, puis {dailyQuota} emails/jour.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Email Identity Card */}
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Identité d&apos;envoi</CardTitle>
                                <CardDescription>Personnalisez l&apos;expéditeur et la signature</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* From Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fromName">Nom de l&apos;expéditeur</Label>
                            <Input
                                id="fromName"
                                value={fromName}
                                onChange={e => setFromName(e.target.value)}
                                placeholder="Votre nom"
                                className="rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">
                                Ce nom apparaîtra dans la boîte de réception du destinataire
                            </p>
                        </div>

                        {/* Signature */}
                        <div className="space-y-2">
                            <Label htmlFor="signature">Signature</Label>
                            <Textarea
                                id="signature"
                                value={signature}
                                onChange={e => setSignature(e.target.value)}
                                placeholder="Cordialement,&#10;[Votre nom]&#10;[Poste]&#10;[Entreprise]"
                                rows={5}
                                className="rounded-xl resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Cette signature sera automatiquement ajoutée à tous vos emails sortants
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={updateSettings.isPending || sendingDays.length === 0}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/25 px-8 rounded-xl"
                    >
                        {updateSettings.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            'Enregistrer les paramètres'
                        )}
                    </Button>
                </div>
            </form>
        </TooltipProvider>
    );
}

function SendingSettingsFormSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg shadow-slate-100">
                <CardHeader>
                    <Skeleton className="h-10 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
            <Card className="border-0 shadow-lg shadow-slate-100">
                <CardHeader>
                    <Skeleton className="h-10 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}
