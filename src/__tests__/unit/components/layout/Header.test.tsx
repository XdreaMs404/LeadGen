import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';
import { describe, it, expect, vi } from 'vitest';

// Mock UserNav
vi.mock('@/components/layout/UserNav', () => ({
    UserNav: () => <div data-testid="user-nav">UserNav</div>,
}));

// Mock supabase server client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
        },
    })),
}));

describe('Header Component', () => {
    it('renders the header correctly', async () => {
        // Header is async, so we await it to get the component tree
        const HeaderComponent = await Header();
        render(HeaderComponent);

        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
        expect(screen.getByTestId('user-nav')).toBeInTheDocument();
    });
});
