import { Suspense } from 'react';
import { InboxPageClient } from '@/components/features/inbox/InboxPageClient';
import { InboxSkeleton } from '@/components/features/inbox/InboxSkeleton';

export default function InboxPage() {
    return (
        <Suspense fallback={<InboxSkeleton />}>
            <InboxPageClient />
        </Suspense>
    );
}
