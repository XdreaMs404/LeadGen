/**
 * ProspectStatusBadge Component Tests
 * Story 3.4: Prospect List & Status Display with Filters
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProspectStatusBadge } from '@/components/features/prospects/ProspectStatusBadge';
import type { ProspectStatus } from '@/types/prospect';

describe('ProspectStatusBadge', () => {
    const testCases: { status: ProspectStatus; label: string; hasIcon?: boolean }[] = [
        { status: 'NEW', label: 'Nouveau', hasIcon: false },
        { status: 'ENRICHING', label: 'Enrichissement...', hasIcon: true },
        { status: 'VERIFIED', label: 'Vérifié', hasIcon: true },
        { status: 'NOT_VERIFIED', label: 'Non vérifié', hasIcon: true },
        { status: 'NEEDS_REVIEW', label: 'À vérifier', hasIcon: true },
        { status: 'SUPPRESSED', label: 'Supprimé', hasIcon: false },
        { status: 'CONTACTED', label: 'Contacté', hasIcon: false },
        { status: 'REPLIED', label: 'A répondu', hasIcon: false },
        { status: 'BOUNCED', label: 'Rebond', hasIcon: false },
        { status: 'UNSUBSCRIBED', label: 'Désabonné', hasIcon: false },
        { status: 'BOOKED', label: 'RDV', hasIcon: false },
    ];

    testCases.forEach(({ status, label }) => {
        it(`renders correct label for ${status} status`, () => {
            render(<ProspectStatusBadge status={status} />);
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it('applies strikethrough style for SUPPRESSED status', () => {
        render(<ProspectStatusBadge status="SUPPRESSED" />);
        const badge = screen.getByText('Supprimé');
        // Check that the badge or its container has line-through class
        expect(badge.closest('[class*="line-through"]')).toBeInTheDocument();
    });

    it('shows spinner animation for ENRICHING status', () => {
        render(<ProspectStatusBadge status="ENRICHING" />);
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<ProspectStatusBadge status="NEW" className="custom-class" />);
        // The Badge renders as a span or similar - find by text and check the element
        const badge = screen.getByText('Nouveau');
        expect(badge.closest('[class*="custom-class"]')).toBeInTheDocument();
    });
});
