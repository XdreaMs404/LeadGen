import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { signOut, type SignOutOptions } from '@/lib/auth/actions';

// Mock Supabase client
const mockSignOut = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signOut: mockSignOut,
        },
    }),
}));

describe('signOut', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully sign out with default options', async () => {
        mockSignOut.mockResolvedValueOnce({ error: null });

        const result = await signOut();

        expect(result).toEqual({ success: true });
        expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('should sign out with global scope when specified', async () => {
        mockSignOut.mockResolvedValueOnce({ error: null });

        const result = await signOut({ scope: 'global' });

        expect(result).toEqual({ success: true });
        expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });
    });

    it('should clear TanStack Query cache when queryClient is provided', async () => {
        mockSignOut.mockResolvedValueOnce({ error: null });
        const mockQueryClient = { clear: vi.fn() };

        const result = await signOut({ queryClient: mockQueryClient as unknown as SignOutOptions['queryClient'] });

        expect(result).toEqual({ success: true });
        expect(mockQueryClient.clear).toHaveBeenCalled();
    });

    it('should not clear cache if queryClient is not provided', async () => {
        mockSignOut.mockResolvedValueOnce({ error: null });

        const result = await signOut();

        expect(result).toEqual({ success: true });
        // No error should occur even without queryClient
    });

    it('should return error when Supabase signOut fails', async () => {
        const errorMessage = 'Network error';
        mockSignOut.mockResolvedValueOnce({ error: { message: errorMessage } });

        const result = await signOut();

        expect(result).toEqual({ success: false, error: errorMessage });
    });

    it('should handle exceptions gracefully', async () => {
        mockSignOut.mockRejectedValueOnce(new Error('Unexpected failure'));

        const result = await signOut();

        expect(result).toEqual({ success: false, error: 'Unexpected failure' });
    });

    it('should handle non-Error exceptions', async () => {
        mockSignOut.mockRejectedValueOnce('String error');

        const result = await signOut();

        expect(result).toEqual({ success: false, error: 'Unknown error during signOut' });
    });
});
