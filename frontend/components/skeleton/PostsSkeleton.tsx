export default function RecentPostsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="rounded-2xl overflow-hidden border border-border bg-card p-4 space-y-4 shadow-xs"
                >
                    <div className="w-full h-41 bg-border/50 rounded-xl animate-pulse" />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-border/50 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-border/50 rounded animate-pulse" />
                        </div>

                        <div className="h-5 w-24 bg-border/50 rounded-md animate-pulse" />

                        <div className="h-4 w-3/4 bg-border/50 rounded animate-pulse" />

                        <div className="h-5 w-full bg-border/50 rounded animate-pulse" />

                        <div className="space-y-2 pt-1">
                            <div className="h-3.5 w-full bg-border/50 rounded animate-pulse" />
                            <div className="h-3.5 w-2/3 bg-border/50 rounded animate-pulse" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                        <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-8 bg-border/50 rounded ml-auto animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}