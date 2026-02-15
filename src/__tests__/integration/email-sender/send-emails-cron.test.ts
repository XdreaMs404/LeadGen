/**
 * Integration Tests: Send Emails Cron Route
 * Story 5.5: Gmail API Email Sending with Threading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/email-scheduler/email-sender', () => ({
    processPendingEmails: vi.fn(),
}));

import { processPendingEmails } from '@/lib/email-scheduler/email-sender';
import { GET, POST } from '@/app/api/cron/send-emails/route';

const mockProcessPendingEmails = vi.mocked(processPendingEmails);

describe('POST /api/cron/send-emails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('CRON_SECRET', 'test-secret');
        vi.stubEnv('NODE_ENV', 'production');
    });

    it('requires authorization header', async () => {
        const request = new NextRequest('http://localhost/api/cron/send-emails', {
            method: 'POST',
        });

        const response = await POST(request);

        expect(response.status).toBe(401);
    });

    it('accepts valid authorization header', async () => {
        mockProcessPendingEmails.mockResolvedValueOnce({
            processed: 5,
            sent: 3,
            skippedQuota: 0,
            cancelled: 1,
            failed: 1,
            durationMs: 1500,
        });

        const request = new NextRequest('http://localhost/api/cron/send-emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-secret',
            },
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.stats.sent).toBe(3);
        expect(json.stats.processed).toBe(5);
    });

    it('respects limit query parameter', async () => {
        mockProcessPendingEmails.mockResolvedValueOnce({
            processed: 0,
            sent: 0,
            skippedQuota: 0,
            cancelled: 0,
            failed: 0,
            durationMs: 100,
        });

        const request = new NextRequest('http://localhost/api/cron/send-emails?limit=5', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-secret',
            },
        });

        await POST(request);

        expect(mockProcessPendingEmails).toHaveBeenCalledWith(5);
    });

    it('handles processing errors gracefully', async () => {
        mockProcessPendingEmails.mockRejectedValueOnce(new Error('Database connection failed'));

        const request = new NextRequest('http://localhost/api/cron/send-emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-secret',
            },
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.success).toBe(false);
        expect(json.error).toBe('Database connection failed');
    });
});

describe('GET /api/cron/send-emails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('CRON_SECRET', 'test-secret');
        vi.stubEnv('NODE_ENV', 'production');
    });

    it('works the same as POST (for Vercel Cron compatibility)', async () => {
        mockProcessPendingEmails.mockResolvedValueOnce({
            processed: 2,
            sent: 2,
            skippedQuota: 0,
            cancelled: 0,
            failed: 0,
            durationMs: 500,
        });

        const request = new NextRequest('http://localhost/api/cron/send-emails', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer test-secret',
            },
        });

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.stats.sent).toBe(2);
    });
});

describe('Development mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows requests without secret in development when CRON_SECRET is not set', async () => {
        vi.stubEnv('CRON_SECRET', '');
        vi.stubEnv('NODE_ENV', 'development');

        mockProcessPendingEmails.mockResolvedValueOnce({
            processed: 0,
            sent: 0,
            skippedQuota: 0,
            cancelled: 0,
            failed: 0,
            durationMs: 50,
        });

        const request = new NextRequest('http://localhost/api/cron/send-emails', {
            method: 'POST',
        });

        const response = await POST(request);

        // In development without CRON_SECRET, should allow
        expect(response.status).toBe(200);
    });
});
