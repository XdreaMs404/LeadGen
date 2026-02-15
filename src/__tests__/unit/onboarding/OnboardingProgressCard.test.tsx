import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingProgressCard } from '@/components/features/dashboard/OnboardingProgressCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Tooltip provider
vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('OnboardingProgressCard', () => {
    it('renders the card with title', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={false}
                spfStatus="NOT_STARTED"
                dkimStatus="NOT_STARTED"
                dmarcStatus="NOT_STARTED"
                progressPercent={0}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Configuration requise')).toBeInTheDocument();
    });

    it('shows 0% progress when nothing is done', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={false}
                spfStatus="NOT_STARTED"
                dkimStatus="NOT_STARTED"
                dmarcStatus="NOT_STARTED"
                progressPercent={0}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('shows 100% progress when all complete', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={true}
                spfStatus="PASS"
                dkimStatus="PASS"
                dmarcStatus="PASS"
                progressPercent={100}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('shows step counter correctly', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={true}
                spfStatus="PASS"
                dkimStatus="NOT_STARTED"
                dmarcStatus="NOT_STARTED"
                progressPercent={50}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('2')).toBeInTheDocument(); // 2 completed
        expect(screen.getByText('4')).toBeInTheDocument(); // out of 4
    });

    it('shows Gmail step', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={false}
                spfStatus="NOT_STARTED"
                dkimStatus="NOT_STARTED"
                dmarcStatus="NOT_STARTED"
                progressPercent={0}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Connexion Gmail')).toBeInTheDocument();
    });

    it('has a continue button linking to onboarding', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={false}
                spfStatus="NOT_STARTED"
                dkimStatus="NOT_STARTED"
                dmarcStatus="NOT_STARTED"
                progressPercent={0}
            />,
            { wrapper: createWrapper() }
        );

        const button = screen.getByRole('link', { name: /Continuer la configuration/i });
        expect(button).toHaveAttribute('href', '/onboarding');
    });

    it('has correct test id', () => {
        render(
            <OnboardingProgressCard
                gmailConnected={false}
                spfStatus="NOT_STARTED"
                dkimStatus="NOT_STARTED"
                dmarcStatus="NOT_STARTED"
                progressPercent={0}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByTestId('onboarding-progress-card')).toBeInTheDocument();
    });
});
