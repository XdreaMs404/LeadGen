import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingBanner } from '@/components/shared/OnboardingBanner';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        button: ({ children, onClick, ...props }: any) => (
            <button onClick={onClick} {...props}>{children}</button>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('OnboardingBanner', () => {
    it('renders the banner with message', () => {
        render(<OnboardingBanner />);
        expect(
            screen.getByText('Complétez la configuration pour commencer à envoyer')
        ).toBeInTheDocument();
    });

    it('has a link to onboarding page', () => {
        render(<OnboardingBanner />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/settings/onboarding');
    });

    it('can be dismissed', () => {
        render(<OnboardingBanner />);
        const banner = screen.getByTestId('onboarding-banner');
        expect(banner).toBeInTheDocument();

        const dismissButton = screen.getByRole('button', { name: /Fermer la bannière/i });
        fireEvent.click(dismissButton);

        expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();
    });

    it('has dark background', () => {
        render(<OnboardingBanner />);
        const banner = screen.getByTestId('onboarding-banner');
        expect(banner.className).toContain('from-slate-900');
    });
});
