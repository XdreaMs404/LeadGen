import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpfStep } from '@/components/features/onboarding/SpfStep';
import { DmarcStep } from '@/components/features/onboarding/DmarcStep';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock navigator.clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

describe('SpfStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWriteText.mockResolvedValue(undefined);
    });

    it('should render SPF step with domain', () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />);

        expect(screen.getByText('Étape 1 : Configurer SPF')).toBeInTheDocument();
        expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('should display the correct SPF record', () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />);

        expect(screen.getByText('v=spf1 include:_spf.google.com ~all')).toBeInTheDocument();
    });

    it('should copy SPF record to clipboard when copy button is clicked', async () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />);

        const copyButton = screen.getByTestId('copy-spf-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalledWith('v=spf1 include:_spf.google.com ~all');
            expect(toast.success).toHaveBeenCalledWith('Copié dans le presse-papier !', { duration: 2000 });
        });
    });

    it('should show error toast when copy fails', async () => {
        mockWriteText.mockRejectedValue(new Error('Copy failed'));

        render(<SpfStep domain="example.com" status="NOT_STARTED" />);

        const copyButton = screen.getByTestId('copy-spf-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erreur lors de la copie');
        });
    });

    it('should render DNS provider links', () => {
        render(<SpfStep domain="example.com" status="NOT_STARTED" />);

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
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />);

        expect(screen.getByText('Étape 3 : Configurer DMARC')).toBeInTheDocument();
    });

    it('should display the correct DMARC record name', () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />);

        expect(screen.getByText('_dmarc.example.com')).toBeInTheDocument();
    });

    it('should display the correct DMARC record value', () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />);

        expect(screen.getByText('v=DMARC1; p=none; rua=mailto:dmarc@example.com')).toBeInTheDocument();
    });

    it('should copy DMARC record to clipboard when copy button is clicked', async () => {
        render(<DmarcStep domain="example.com" status="NOT_STARTED" />);

        const copyButton = screen.getByTestId('copy-dmarc-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalledWith('v=DMARC1; p=none; rua=mailto:dmarc@example.com');
            expect(toast.success).toHaveBeenCalledWith('Copié dans le presse-papier !', { duration: 2000 });
        });
    });
});
