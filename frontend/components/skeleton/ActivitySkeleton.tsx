export default function RecentActivitySkeleton() {
    return (
        <div className="space-y-1 py-1">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="flex items-center justify-between p-3.5 sm:p-4 gap-3 animate-pulse"
                >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-border/50 shrink-0" />

                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-border/50 rounded" />
                            <div className="h-3 w-1/3 bg-border/50 rounded" />
                        </div>
                    </div>

                    <div className="h-4 w-12 bg-border/50 rounded shrink-0" />
                </div>
            ))}
        </div>
    );
}