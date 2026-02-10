/**
 * Inbox Loading State (Story 6.3 AC1)
 * 
 * Skeleton loading state for the inbox page while data is being fetched.
 */

export default function InboxLoading() {
    return (
        <div className="h-full flex flex-col animate-pulse">
            {/* Header Skeleton */}
            <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-24 bg-slate-200 rounded" />
                        <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
                {/* Filters skeleton */}
                <div className="flex gap-3">
                    <div className="h-9 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-9 w-32 bg-slate-200 rounded-lg" />
                    <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-36 bg-slate-200 rounded" />
                                <div className="h-3 w-20 bg-slate-200 rounded" />
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
