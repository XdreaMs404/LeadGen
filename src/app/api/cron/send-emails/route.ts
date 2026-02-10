/**
 * Cron Route: Send Emails
 * Story 5.5: Gmail API Email Sending with Threading
 * 
 * Vercel Cron endpoint for processing scheduled emails
 * Runs every 5 minutes
 */

import { NextResponse } from 'next/server';
import { processPendingEmails } from '@/lib/email-scheduler/email-sender';

/**
 * Maximum emails to process per cron run
 */
const DEFAULT_LIMIT = 10;

/**
 * Verify the cron secret from Vercel
 */
function verifyCronSecret(request: Request): boolean {
    // In development, always allow access for testing
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Cron] Development mode - allowing access without secret');
        return true;
    }

    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('[Cron] CRON_SECRET not configured in production');
        return false;
    }

    return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/cron/send-emails
 * 
 * Process pending scheduled emails
 * Protected by CRON_SECRET header verification
 */
export async function POST(request: Request) {
    // Verify authorization
    if (!verifyCronSecret(request)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Parse optional limit from query params
        const url = new URL(request.url);
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;

        console.log(`[Cron] Starting email processing run (limit: ${limit})`);

        // Process pending emails
        const stats = await processPendingEmails(limit);

        console.log(`[Cron] Completed email processing:`, stats);

        return NextResponse.json({
            success: true,
            stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Email processing failed:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/send-emails
 * 
 * Vercel Cron uses GET by default
 */
export async function GET(request: Request) {
    return POST(request);
}

/**
 * Runtime configuration
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for email processing
