import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { describe, it, expect, vi } from 'vitest';
import { redirect } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }),
}));

// Mock supabase server client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(),
        },
    })),
}));

describe('DashboardPage', () => {
    it('redirects to login if user is not authenticated', async () => {
        // Mock getUser to return null user
        const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
        const { createClient } = await import('@/lib/supabase/server');
        (createClient as any).mockReturnValue({
            auth: {
                getUser: mockGetUser,
            },
        });

        try {
            await DashboardPage();
        } catch (error) {
            // Ignore redirect error
        }

        expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('renders welcome message when authenticated', async () => {
        // Mock getUser to return a user
        const mockUser = {
            email: 'test@example.com',
            user_metadata: {
                full_name: 'Test User',
            },
        };
        const mockGetUser = vi.fn().mockResolvedValue({ data: { user: mockUser } });
        const { createClient } = await import('@/lib/supabase/server');
        (createClient as any).mockReturnValue({
            auth: {
                getUser: mockGetUser,
            },
        });

        const Page = await DashboardPage();
        render(Page);

        // Check for French greeting with first name
        expect(screen.getByText(/Bonjour Test/)).toBeInTheDocument();
        // Check for value proposition
        expect(screen.getByText(/Bienvenue sur LeadGen/)).toBeInTheDocument();
    });
});
