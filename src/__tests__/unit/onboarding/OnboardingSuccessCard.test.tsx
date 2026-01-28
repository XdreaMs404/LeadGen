import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingSuccessCard } from '@/components/features/dashboard/OnboardingSuccessCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('OnboardingSuccessCard', () => {
    it('renders success message', () => {
        render(<OnboardingSuccessCard />);
        expect(screen.getByText('Configuration terminée !')).toBeInTheDocument();
    });

    it('shows all checklist items', () => {
        render(<OnboardingSuccessCard />);
        expect(screen.getByText('Connexion Gmail')).toBeInTheDocument();
        expect(screen.getByText('SPF configuré')).toBeInTheDocument();
        expect(screen.getByText('DKIM configuré')).toBeInTheDocument();
        expect(screen.getByText('DMARC configuré')).toBeInTheDocument();
    });

    it('has CTA button to prospects', () => {
        render(<OnboardingSuccessCard />);
        const button = screen.getByRole('link', { name: /Commencer à prospecter/i });
        expect(button).toHaveAttribute('href', '/prospects');
    });

    it('has correct test id', () => {
        render(<OnboardingSuccessCard />);
        expect(screen.getByTestId('onboarding-success-card')).toBeInTheDocument();
    });
});
