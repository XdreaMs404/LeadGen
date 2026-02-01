import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { success, error } from '@/lib/utils/api-response';
import { sendingSettingsSchema } from '@/lib/utils/validation';
import { mapSendingSettings } from '@/lib/prisma/mappers';
import { DEFAULT_SENDING_SETTINGS } from '@/types/sending-settings';

/**
 * GET /api/settings/sending
 * Fetch sending settings for current workspace
 * Creates default settings if not exists
 * Story 5.3: Sending Settings Configuration
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                error('UNAUTHORIZED', 'Non authentifié'),
                { status: 401 }
            );
        }

        const workspaceId = await getWorkspaceId(user.id);

        // Find or create settings
        let settings = await prisma.sendingSettings.findUnique({
            where: { workspaceId },
        });

        if (!settings) {
            // Fetch user name for default fromName
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { name: true }
            });

            // Create default settings
            settings = await prisma.sendingSettings.create({
                data: {
                    workspaceId,
                    sendingDays: DEFAULT_SENDING_SETTINGS.sendingDays,
                    startHour: DEFAULT_SENDING_SETTINGS.startHour,
                    endHour: DEFAULT_SENDING_SETTINGS.endHour,
                    timezone: DEFAULT_SENDING_SETTINGS.timezone,
                    dailyQuota: DEFAULT_SENDING_SETTINGS.dailyQuota,
                    rampUpEnabled: DEFAULT_SENDING_SETTINGS.rampUpEnabled,
                    fromName: dbUser?.name || null,
                },
            });
        }

        return NextResponse.json(success(mapSendingSettings(settings)));
    } catch (err) {
        console.error('Error fetching sending settings:', err);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la récupération des paramètres'),
            { status: 500 }
        );
    }
}

/**
 * PUT /api/settings/sending
 * Update sending settings for current workspace
 * Story 5.3: Sending Settings Configuration
 */
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                error('UNAUTHORIZED', 'Non authentifié'),
                { status: 401 }
            );
        }

        const workspaceId = await getWorkspaceId(user.id);
        const body = await request.json();

        // Validate input
        const validationResult = sendingSettingsSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', validationResult.error.issues),
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Upsert settings (create if not exists, update if exists)
        const settings = await prisma.sendingSettings.upsert({
            where: { workspaceId },
            create: {
                workspaceId,
                sendingDays: data.sendingDays,
                startHour: data.startHour,
                endHour: data.endHour,
                timezone: data.timezone,
                dailyQuota: data.dailyQuota,
                rampUpEnabled: data.rampUpEnabled,
                fromName: data.fromName,
                signature: data.signature,
            },
            update: {
                sendingDays: data.sendingDays,
                startHour: data.startHour,
                endHour: data.endHour,
                timezone: data.timezone,
                dailyQuota: data.dailyQuota,
                rampUpEnabled: data.rampUpEnabled,
                fromName: data.fromName,
                signature: data.signature,
            },
        });

        return NextResponse.json(success(mapSendingSettings(settings)));
    } catch (err) {
        console.error('Error updating sending settings:', err);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la mise à jour des paramètres'),
            { status: 500 }
        );
    }
}
