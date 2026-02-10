/**
 * Unit Tests: Gmail Threading Service
 * Story 5.5: Gmail API Email Sending with Threading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions before import
const mockSentEmailFindFirst = vi.fn();
const mockSentEmailCount = vi.fn();

// Mock Prisma with explicit structure
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        sentEmail: {
            findFirst: (...args: unknown[]) => mockSentEmailFindFirst(...args),
            count: (...args: unknown[]) => mockSentEmailCount(...args),
        },
    },
}));

import {
    getThreadContext,
    getLatestSentEmail,
    arePreviousStepsSent,
} from '@/lib/gmail/threading';

describe('getThreadContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null for step 1 (new thread)', async () => {
        const result = await getThreadContext('campaign-1', 'prospect-1', 1);

        expect(result).toBeNull();
        expect(mockSentEmailFindFirst).not.toHaveBeenCalled();
    });

    it('returns thread context for step 2 when step 1 was sent', async () => {
        mockSentEmailFindFirst.mockResolvedValueOnce({
            messageId: '18e1234567890abc',
            threadId: 'thread-xyz',
            subject: 'Original Subject',
        });

        const result = await getThreadContext('campaign-1', 'prospect-1', 2);

        expect(result).not.toBeNull();
        expect(result!.threadId).toBe('thread-xyz');
        expect(result!.inReplyTo).toBe('<18e1234567890abc@mail.gmail.com>');
        expect(result!.references).toBe('<18e1234567890abc@mail.gmail.com>');
        expect(result!.originalSubject).toBe('Original Subject');
    });

    it('returns null when no previous email found', async () => {
        mockSentEmailFindFirst.mockResolvedValueOnce(null);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const result = await getThreadContext('campaign-1', 'prospect-1', 2);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('handles already formatted message IDs', async () => {
        mockSentEmailFindFirst.mockResolvedValueOnce({
            messageId: '<already-formatted@mail.gmail.com>',
            threadId: 'thread-xyz',
            subject: 'Subject',
        });

        const result = await getThreadContext('campaign-1', 'prospect-1', 3);

        expect(result!.inReplyTo).toBe('<already-formatted@mail.gmail.com>');
    });
});

describe('getLatestSentEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns latest sent email info', async () => {
        mockSentEmailFindFirst.mockResolvedValueOnce({
            messageId: 'msg-latest',
            threadId: 'thread-1',
            subject: 'Latest Subject',
            scheduledEmail: { stepNumber: 2 },
        });

        const result = await getLatestSentEmail('campaign-1', 'prospect-1');

        expect(result).not.toBeNull();
        expect(result!.messageId).toBe('msg-latest');
        expect(result!.stepNumber).toBe(2);
    });

    it('returns null when no emails sent', async () => {
        mockSentEmailFindFirst.mockResolvedValueOnce(null);

        const result = await getLatestSentEmail('campaign-1', 'prospect-1');

        expect(result).toBeNull();
    });
});

describe('arePreviousStepsSent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns true for step 1', async () => {
        const result = await arePreviousStepsSent('campaign-1', 'prospect-1', 1);

        expect(result).toBe(true);
        expect(mockSentEmailCount).not.toHaveBeenCalled();
    });

    it('returns true when all previous steps are sent', async () => {
        // For step 3, we need 2 previous steps sent
        mockSentEmailCount.mockResolvedValueOnce(2);

        const result = await arePreviousStepsSent('campaign-1', 'prospect-1', 3);

        expect(result).toBe(true);
    });

    it('returns false when previous steps are missing', async () => {
        // For step 2, we need 1 previous step sent
        mockSentEmailCount.mockResolvedValueOnce(0);

        const result = await arePreviousStepsSent('campaign-1', 'prospect-1', 2);

        expect(result).toBe(false);
    });
});
