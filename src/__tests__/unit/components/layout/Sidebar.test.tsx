import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';
import { describe, it, expect, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}));

describe('Sidebar Component', () => {
    it('renders all navigation links', () => {
        (usePathname as any).mockReturnValue('/dashboard');
        render(<Sidebar />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Prospects')).toBeInTheDocument();
        expect(screen.getByText('Séquences')).toBeInTheDocument();
        expect(screen.getByText('Inbox')).toBeInTheDocument();
        expect(screen.getByText('Paramètres')).toBeInTheDocument();
    });

    it('highlights the active link', () => {
        // Mock current path to be /prospects
        (usePathname as any).mockReturnValue('/prospects');
        render(<Sidebar />);

        const prospectsLink = screen.getByText('Prospects').closest('a');
        // New design uses gradient classes instead of bg-primary/10
        expect(prospectsLink).toHaveClass('bg-gradient-to-r');

        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).not.toHaveClass('bg-gradient-to-r');
    });
});
