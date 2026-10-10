export default function ExploreTopLocationsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="relative h-68 sm:h-76 md:h-86 rounded-2xl overflow-hidden border-4 border-white bg-border p-5 sm:p-6 flex flex-col justify-end animate-pulse"
                >
                    <div className="w-full h-41 bg-white/50 rounded-xl animate-pulse mb-4" />

                    <div className="space-y-3 z-10 w-full">
                        <div className="h-6 w-3/4 bg-white/50 rounded" />

                        <div className="h-4 w-1/2 bg-white/50 rounded" />

                        <div className="h-4 w-1/3 bg-white/50 rounded pt-1" />
                    </div>

                    <div className="absolute bottom-5 right-5 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/50" />
                </div>
            ))}
        </div>
    );
}