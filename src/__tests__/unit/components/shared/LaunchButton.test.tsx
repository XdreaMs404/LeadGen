import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LaunchButton } from '@/components/shared/LaunchButton';
import { useCanSend } from '@/hooks/use-can-send';

// Mock the hook
vi.mock('@/hooks/use-can-send', () => ({
    useCanSend: vi.fn(),
}));

// Mock Tooltip components since they require provider context
vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

describe('LaunchButton', () => {
    const mockOnLaunch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders enabled button when canSend is true', () => {
        vi.mocked(useCanSend).mockReturnValue({
            canSend: true,
            blockedReason: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<LaunchButton onLaunch={mockOnLaunch} />);

        const button = screen.getByRole('button', { name: /lancer la campagne/i });
        expect(button).toBeEnabled();

        fireEvent.click(button);
        expect(mockOnLaunch).toHaveBeenCalledTimes(1);
    });

    it('renders disabled button with tooltip when canSend is false', () => {
        vi.mocked(useCanSend).mockReturnValue({
            canSend: false,
            blockedReason: 'Blocking reason',
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<LaunchButton onLaunch={mockOnLaunch} />);

        const button = screen.getByRole('button', { name: /lancer la campagne/i });
        expect(button).toBeDisabled();

        // Check for tooltip content
        expect(screen.getByText('Blocking reason')).toBeInTheDocument();

        // Ensure click doesn't fire
        fireEvent.click(button);
        expect(mockOnLaunch).not.toHaveBeenCalled();
    });

    it('renders loading state when isLoading is true', () => {
        vi.mocked(useCanSend).mockReturnValue({
            canSend: false,
            blockedReason: undefined,
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        });

        render(<LaunchButton onLaunch={mockOnLaunch} />);

        expect(screen.getByRole('button', { name: /vérification/i })).toBeDisabled();
        expect(screen.getByRole('button')).toHaveTextContent('Vérification...');
    });

    it('respects parent disabled prop even if canSend is true', () => {
        vi.mocked(useCanSend).mockReturnValue({
            canSend: true,
            blockedReason: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<LaunchButton onLaunch={mockOnLaunch} disabled={true} />);

        const button = screen.getByRole('button', { name: /lancer la campagne/i });
        expect(button).toBeDisabled();
    });
});
