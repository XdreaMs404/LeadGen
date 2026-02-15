import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAllWorkspaces } from '@/lib/inbox/sync-worker';
import { GmailSendError } from '@/lib/gmail/sender';
import { fetchNewMessages } from '@/lib/gmail/inbox-sync';

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => ({
    mockPrisma: {
        workspace: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        gmailToken: {
            update: vi.fn(),
        },
        sentEmail: {
            findFirst: vi.fn(),
        },
        conversation: {
            upsert: vi.fn().mockResolvedValue({ id: 'conv-1' }),
        },
        inboxMessage: {
            upsert: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
        },
        campaignProspect: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        scheduledEmail: {
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
        prospect: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: mockPrisma,
}));

// Mock Crypto
vi.mock('@/lib/crypto/encrypt', () => ({
    decrypt: vi.fn(() => 'access-token'),
}));

// Mock Gmail Sync
vi.mock('@/lib/gmail/inbox-sync', () => ({
    fetchNewMessages: vi.fn(),
    fetchMessageDetails: vi.fn(),
    isInboundMessage: vi.fn(() => true),
    isAuthError: vi.fn((code) => code === 401),
    extractEmailAddress: vi.fn((email) => email),
}));

vi.mock('@/lib/inbox/classification/classification-service', () => ({
    classifyMessage: vi.fn().mockResolvedValue({
        classification: 'OTHER',
        confidenceScore: 85,
        classificationMethod: 'LLM',
        needsReview: false,
    }),
    applyClassification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/inbox/classification/auto-actions', () => ({
    handleClassificationActions: vi.fn().mockResolvedValue(undefined),
}));

describe('Inbox Sync Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should invalidate token on 401 error', async () => {
        // 1. Mock finding workspaces to process
        mockPrisma.workspace.findMany.mockResolvedValue([
            { id: 'ws-1' }
        ]);

        // 2. Mock finding specific workspace details (called by syncWorkspaceInbox)
        mockPrisma.workspace.findUnique.mockResolvedValue({
            id: 'ws-1',
            gmailToken: {
                accessToken: 'encrypted',
                email: 'test@example.com',
            },
        });

        // 3. Mock fetchNewMessages to throw 401 Auth Error
        vi.mocked(fetchNewMessages).mockRejectedValue(
            new GmailSendError('Token expired', 'AUTH_ERROR', 401, false)
        );

        // 4. Run the process
        const results = await processAllWorkspaces();

        // 5. Verify results
        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(false);
        expect(results[0].workspaceId).toBe('ws-1');

        // 6. Verify token invalidation was called
        expect(mockPrisma.gmailToken.update).toHaveBeenCalledWith({
            where: { workspaceId: 'ws-1' },
            data: {
                isValid: false,
                lastAuthError: expect.stringContaining('Token expired'),
            },
        });
    });
});
