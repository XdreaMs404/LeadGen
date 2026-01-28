import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteProspectDialog } from '@/components/features/prospects/DeleteProspectDialog';
import { useDeleteProspect, useProspectActiveCampaigns } from '@/hooks/use-delete-prospect';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Prospect } from '@/types/prospect';

// Mock hook dependencies
vi.mock('@/hooks/use-delete-prospect');
vi.mock('@/components/ui/alert-dialog', () => ({
    AlertDialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    AlertDialogContent: ({ children }: any) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
    AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

describe('DeleteProspectDialog', () => {
    const mockProspect: Prospect = {
        id: 'prospect-1',
        workspaceId: 'workspace-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        deletedBy: null,
        company: null,
        title: null,
        phone: null,
        linkedinUrl: null,
        source: 'OTHER',
        sourceDetail: null,
        enrichmentSource: null,
        enrichedAt: null,
        enrichmentData: null,
    };

    const mockDeleteProspect = vi.fn();
    const mockOnOpenChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteProspect as any).mockReturnValue({
            mutate: mockDeleteProspect,
            isPending: false,
        });
        (useProspectActiveCampaigns as any).mockReturnValue({
            data: { campaigns: [] },
            isLoading: false,
        });
    });

    it('renders dialog when open', () => {
        render(
            <DeleteProspectDialog
                prospect={mockProspect}
                workspaceId="workspace-1"
                open={true}
                onOpenChange={mockOnOpenChange}
            />
        );

        expect(screen.getByText(/Supprimer le prospect/i)).toBeInTheDocument();
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('shows warning when active campaigns exist', () => {
        (useProspectActiveCampaigns as any).mockReturnValue({
            data: {
                campaigns: [{ id: 'c1', name: 'Campaign 1', status: 'ACTIVE' }]
            },
            isLoading: false,
        });

        render(
            <DeleteProspectDialog
                prospect={mockProspect}
                workspaceId="workspace-1"
                open={true}
                onOpenChange={mockOnOpenChange}
            />
        );

        expect(screen.getByText(/Ce prospect est dans 1 campagne/i)).toBeInTheDocument();
    });

    it('calls delete mutation on confirm', () => {
        render(
            <DeleteProspectDialog
                prospect={mockProspect}
                workspaceId="workspace-1"
                open={true}
                onOpenChange={mockOnOpenChange}
            />
        );

        fireEvent.click(screen.getByText('Supprimer définitivement'));

        expect(mockDeleteProspect).toHaveBeenCalledWith('prospect-1', expect.any(Object));
    });
});
