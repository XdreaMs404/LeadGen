import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpfStep } from '@/components/features/onboarding/SpfStep';
import { DmarcStep } from '@/components/features/onboarding/DmarcStep';
import { toast } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock useDnsValidation hook
vi.mock('@/hooks/use-dns-validation', () => ({
    useDnsValidation: () => ({
        validateDns: vi.fn(),
        validateDnsAsync: vi.fn(),
        isValidating: false,
        validationResult: null,
        validationError: null,
        validateAllDns: vi.fn(),
        validateAllDnsAsync: vi.fn(),
        isValidatingAll: false,
        validateAllResult: null,
        validateAllError: null,
        overrideDns: vi.fn(),
        overrideDnsAsync: vi.fn(),
        isOverriding: false,
        overrideResult: null,
        overrideError: null,
        resetValidation: vi.fn(),
        resetValidateAll: vi.fn(),
        resetOverride: vi.fn(),
    }),
}));

// Mock navigator.clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

// Wrapper with QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('SpfStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWriteText.mockResolvedValue(undefined);
    });

    it('should render SPF step with domain', () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        expect(screen.getByText('Étape 1 : Configurer SPF')).toBeInTheDocument();
        expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('should display the correct SPF record', () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        expect(screen.getByText('v=spf1 include:_spf.google.com ~all')).toBeInTheDocument();
    });

    it('should copy SPF record to clipboard when copy button is clicked', async () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        const copyButton = screen.getByTestId('copy-spf-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalledWith('v=spf1 include:_spf.google.com ~all');
            expect(toast.success).toHaveBeenCalledWith('Copié dans le presse-papier !', { duration: 2000 });
        });
    });

    it('should show error toast when copy fails', async () => {
        mockWriteText.mockRejectedValue(new Error('Copy failed'));

        render(<SpfStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        const copyButton = screen.getByTestId('copy-spf-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erreur lors de la copie');
        });
    });

    it('should render DNS provider links', () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        expect(screen.getByTestId('provider-cloudflare')).toBeInTheDocument();
        expect(screen.getByTestId('provider-godaddy')).toBeInTheDocument();
        expect(screen.getByTestId('provider-ovh')).toBeInTheDocument();
    });
});

describe('DmarcStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWriteText.mockResolvedValue(undefined);
    });

    it('should render DMARC step with domain', () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        expect(screen.getByText('Étape 3 : Configurer DMARC')).toBeInTheDocument();
    });

    it('should display the correct DMARC record name', () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        // The host field shows "_dmarc" - may appear multiple times in the DOM
        const dmarcElements = screen.getAllByText(/_dmarc/);
        expect(dmarcElements.length).toBeGreaterThan(0);
    });

    it('should display the correct DMARC record value', () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        expect(screen.getByText('v=DMARC1; p=none; rua=mailto:dmarc@example.com')).toBeInTheDocument();
    });

    it('should copy DMARC record to clipboard when copy button is clicked', async () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />, { wrapper: Wrapper });

        const copyButton = screen.getByTestId('copy-dmarc-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalledWith('v=DMARC1; p=none; rua=mailto:dmarc@example.com');
            expect(toast.success).toHaveBeenCalledWith('Copié dans le presse-papier !', { duration: 2000 });
        });
    });
});
