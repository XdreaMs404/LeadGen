/**
 * Inbox Sync Cron Route (Story 6.1)
 * 
 * Cron job endpoint for polling Gmail for new replies
 * Runs every 5 minutes via Vercel cron
 */

import { NextResponse } from 'next/server';
import { processAllWorkspaces } from '@/lib/inbox/sync-worker';

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for processing

/**
 * GET /api/cron/sync-inbox
 * 
 * Triggered by Vercel cron every 5 minutes
 * Syncs Gmail inbox for all connected workspaces
 */
export async function GET(request: Request) {
    // Verify cron secret for security (skip in development)
    const authHeader = request.headers.get('authorization');
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        console.warn('[sync-inbox] Unauthorized cron request');
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    console.log('[sync-inbox] Starting inbox sync cron job');
    const startTime = Date.now();

    try {
        const results = await processAllWorkspaces();

        const summary = {
            totalWorkspaces: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            totalProcessed: results.reduce((acc, r) => acc + (r.result?.processed ?? 0), 0),
            totalMatched: results.reduce((acc, r) => acc + (r.result?.matched ?? 0), 0),
            totalUnlinked: results.reduce((acc, r) => acc + (r.result?.unlinked ?? 0), 0),
            totalErrors: results.reduce((acc, r) => acc + (r.result?.errors ?? 0), 0),
            duration: Date.now() - startTime,
        };

        console.log('[sync-inbox] Cron job complete:', summary);

        return NextResponse.json({
            success: true,
            data: {
                summary,
                workspaces: results.map(r => ({
                    workspaceId: r.workspaceId,
                    success: r.success,
                    processed: r.result?.processed ?? 0,
                    matched: r.result?.matched ?? 0,
                    error: r.error,
                    duration: r.duration,
                })),
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[sync-inbox] Cron job failed:', errorMessage);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SYNC_FAILED',
                    message: errorMessage,
                },
            },
            { status: 500 }
        );
    }
}
