'use client';

/**
 * Inbox Empty State Component (Story 6.3 AC7)
 * 
 * Displayed when the user has no conversations in their inbox.
 * Provides an encouraging message and a CTA to check campaigns.
 */

import Link from 'next/link';
import { Inbox, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InboxEmptyState() {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50">
            <div className="text-center max-w-md px-6">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 flex items-center justify-center mb-6">
                    <Inbox className="h-8 w-8 text-teal-600" />
                </div>

                {/* Message */}
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    No replies yet — keep prospecting!
                </h2>
                <p className="text-slate-600 mb-6">
                    Your inbox is empty for now. Keep running campaigns and replies will appear here.
                </p>

                {/* CTA */}
                <Button asChild>
                    <Link href="/campaigns">
                        Check your campaigns
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
