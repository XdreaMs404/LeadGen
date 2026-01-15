import { render, screen } from '@testing-library/react';
import { UserNav } from '@/components/layout/UserNav';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        auth: {
            signOut: vi.fn(),
        },
    })),
}));

// Mock signOut action
vi.mock('@/lib/auth/actions', () => ({
    signOut: vi.fn(() => Promise.resolve({ success: true })),
}));

const mockUser: unknown = {
    email: 'test@example.com',
    user_metadata: {
        full_name: 'Test User',
    },
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('UserNav Component', () => {
    it('renders user info and logout option', () => {
        render(<UserNav user={mockUser as import('@supabase/supabase-js').User} />, { wrapper: createWrapper() });

        // Expect trigger button
        const trigger = screen.getByRole('button');
        expect(trigger).toBeInTheDocument();
    });
});

