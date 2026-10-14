"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import PostCard from "@/components/landing/PostCard";
import { Button } from "@/components/ui/button";
import { getSearchResults } from "@/app/actions/search";
import { SEARCH_PAGE_SIZE } from "@/lib/search-config";
import type { Report } from "@/types/report";
import { SearchResultsProps } from "@/types/search";

export default function SearchResults({
    term,
    initialData,
}: SearchResultsProps) {
    const [posts, setPosts] = useState<Report[]>(initialData?.posts ?? []);
    const [page, setPage] = useState<number>(initialData?.page ?? 1);
    const [total, setTotal] = useState<number>(initialData?.total ?? 0);
    const [hasMore, setHasMore] = useState<boolean>(
        initialData ? initialData.page < initialData.pageCount : false,
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const isLoadingRef = useRef<boolean>(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadMore = useCallback(async (): Promise<void> => {
        if (isLoadingRef.current || !hasMore) return;

        isLoadingRef.current = true;
        setIsLoading(true);
        setLoadError(false);

        const nextPage = page + 1;
        const response = await getSearchResults(
            term,
            nextPage,
            SEARCH_PAGE_SIZE,
        );

        if (response) {
            setPosts((previous) => {
                const knownIds = new Set(previous.map((post) => post.id));
                return [
                    ...previous,
                    ...response.posts.filter((post) => !knownIds.has(post.id)),
                ];
            });
            setPage(nextPage);
            setTotal(response.total);
            setHasMore(nextPage < response.pageCount);
        } else {
            setLoadError(true);
        }

        isLoadingRef.current = false;
        setIsLoading(false);
    }, [hasMore, page, term]);

    useEffect(() => {
        const node = sentinelRef.current;

        if (!node || !hasMore || loadError) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    void loadMore();
                }
            },
            { rootMargin: "200px" },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasMore, loadError, loadMore]);

    if (posts.length === 0) {
        return (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />

                <h3 className="text-lg font-bold text-foreground">
                    No Civic Reports Found
                </h3>

                <p className="mx-auto max-w-md text-xs text-muted-foreground">
                    We couldn&apos;t find any report matching{" "}
                    <span className="font-semibold text-foreground">
                        &quot;{term}&quot;
                    </span>
                    . Try the tracking code, a word from the title or the
                    address.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {hasMore && !loadError && (
                <div
                    ref={sentinelRef}
                    className="flex h-10 items-center justify-center"
                >
                    {isLoading && (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                </div>
            )}

            {loadError && (
                <div className="flex flex-col items-center gap-2 py-4 text-xs text-muted-foreground">
                    <p>Could not load more results.</p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadMore()}
                    >
                        Try again
                    </Button>
                </div>
            )}

            {!hasMore && !loadError && (
                <p className="py-4 text-center text-xs font-medium text-muted-foreground">
                    End of results ({total} {total === 1 ? "Report" : "Reports"})
                </p>
            )}
        </div>
    );
}