/**
 * New Sequence Page
 * Story 4.1: Sequence Creation - AC1
 */
import { SequenceBuilder } from '@/components/features/sequences/SequenceBuilder';

export default function NewSequencePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20">
            <div className="container max-w-4xl py-10 px-4">
                <SequenceBuilder />
            </div>
        </div>
    );
}
