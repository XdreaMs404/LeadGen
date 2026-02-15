import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClassificationBadge } from '@/components/features/inbox/ClassificationBadge';

describe('ClassificationBadge', () => {
    it('renders unclassified state when classification is null', () => {
        render(<ClassificationBadge classification={null} />);
        expect(screen.getByText('Non classé')).toBeInTheDocument();
    });

    it('renders label for known classification', () => {
        render(<ClassificationBadge classification="INTERESTED" />);
        expect(screen.getByText(/Intéressé/i)).toBeInTheDocument();
    });

    it('shows low confidence indicator only below 70%', () => {
        const { rerender } = render(
            <ClassificationBadge classification="INTERESTED" confidenceScore={0.69} />
        );
        expect(screen.getByTitle('Confiance: 69%')).toBeInTheDocument();

        rerender(<ClassificationBadge classification="INTERESTED" confidenceScore={0.7} />);
        expect(screen.queryByTitle('Confiance: 70%')).not.toBeInTheDocument();
    });
});
