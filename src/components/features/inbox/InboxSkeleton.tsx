'use client';

/**
 * Inbox Skeleton Component (Story 6.3 AC1)
 * 
 * Loading skeleton for the inbox conversation list.
 * Used when fetching conversations.
 */

export function InboxSkeleton() {
    return (
        <div className="flex-1 overflow-hidden animate-pulse">
            <div className="divide-y divide-slate-100">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-36 bg-slate-200 rounded" />
                                <div className="h-3 w-16 bg-slate-200 rounded" />
                            </div>
                            <div className="h-4 w-48 bg-slate-200 rounded" />
                            <div className="h-3 w-full max-w-md bg-slate-100 rounded" />
                        </div>

                        {/* Badge */}
                        <div className="h-5 w-16 bg-slate-200 rounded-full flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
