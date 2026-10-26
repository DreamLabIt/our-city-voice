"use client";

import {
    type FormEvent,
    useEffect,
    useRef,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSearchSuggestions, } from "@/app/actions/search";
import {
    REPORTS_PATH,
    SEARCH_DEBOUNCE_MS,
    SEARCH_MAX_LENGTH,
    SEARCH_MIN_LENGTH,
} from "@/lib/search-config";
import type { ReportSuggestion, SuggestionResult, UseReportSearchOptions } from "@/types/search"

export type SearchStatus = "idle" | "typing" | "loading" | "ready";

const NO_SUGGESTIONS: ReportSuggestion[] = [];

export function useReportSearch({
    syncedQuery,
    clearOnEmptySubmit = false,
    resetQueryOnNavigate = false,
    onNavigate,
    onSearch,
    enabled = true,
}: UseReportSearchOptions = {}) {
    const router = useRouter();
    const [isNavigating, startTransition] = useTransition();
    const [query, setQuery] = useState<string>(syncedQuery ?? "");
    const [previousSyncedQuery, setPreviousSyncedQuery] = useState<
        string | undefined
    >(syncedQuery);

    if (syncedQuery !== previousSyncedQuery) {
        setPreviousSyncedQuery(syncedQuery);
        setQuery(syncedQuery ?? "");
    }

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [result, setResult] = useState<SuggestionResult | null>(null);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const lastFetchedTermRef = useRef<string | null>(null);

    const trimmed = query.trim().slice(0, SEARCH_MAX_LENGTH);
    const isEnabled = enabled && trimmed.length >= SEARCH_MIN_LENGTH;

    useEffect(() => {
        if (!isEnabled) return;
        if (lastFetchedTermRef.current === trimmed) return;

        let isCancelled = false;

        const timer = setTimeout(async () => {
            if (lastFetchedTermRef.current === trimmed) return;

            setIsFetching(true);

            let suggestions: ReportSuggestion[] = [];

            try {
                const response = await getSearchSuggestions(trimmed);
                suggestions = response.suggestions;
            } catch (error) {
                console.error("Suggestions request failed:", error);
            }

            if (isCancelled) return;

            lastFetchedTermRef.current = trimmed;
            setResult({ term: trimmed, suggestions });
            setIsFetching(false);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
            setIsFetching(false);
        };
    }, [trimmed, isEnabled]);

    const isSettled = isEnabled && result !== null && result.term === trimmed;

    const status: SearchStatus = !isEnabled
        ? "idle"
        : isSettled
            ? "ready"
            : isFetching
                ? "loading"
                : "typing";

    const suggestions =
        isSettled && result ? result.suggestions : NO_SUGGESTIONS;

    const showDropdown =
        isOpen && (status === "loading" || status === "ready");

    const goTo = (url: string): void => {
        setIsOpen(false);
        onNavigate?.();

        if (resetQueryOnNavigate) {
            setQuery("");
        }

        startTransition(() => {
            router.push(url);
        });
    };

    const handleInputChange = (value: string): void => {
        setQuery(value);
        setIsOpen(true);
    };

    const openDropdown = (): void => {
        if (isEnabled) setIsOpen(true);
    };

    const closeDropdown = (): void => {
        setIsOpen(false);
    };

    const openIssue = (trackingCode: string): void => {
        if (!trackingCode) return;
        goTo(`/issues/${trackingCode}`);
    };

    const fillQuery = (rawTerm: string): void => {
        const term = rawTerm.trim().slice(0, SEARCH_MAX_LENGTH);

        lastFetchedTermRef.current = term;
        setQuery(term);
        setIsOpen(false);
    };

    const searchFor = (rawTerm: string): void => {
        const term = rawTerm.trim().slice(0, SEARCH_MAX_LENGTH);

        if (term.length > 0 && term.length < SEARCH_MIN_LENGTH) {
            toast.info(
                `Please type at least ${SEARCH_MIN_LENGTH} characters to search.`,
            );
            return;
        }

        lastFetchedTermRef.current = term;

        if (onSearch) {
            setQuery(term);
            setIsOpen(false);
            onSearch(term);
            return;
        }

        if (term.length === 0) {
            if (clearOnEmptySubmit) {
                setQuery("");
                goTo(REPORTS_PATH);
            }
            return;
        }

        setQuery(term);
        goTo(`${REPORTS_PATH}?search=${encodeURIComponent(term)}`);
    };

    const handleSubmit = (event?: FormEvent): void => {
        event?.preventDefault();
        searchFor(query);
    };

    const clearQuery = (): void => {
        setQuery("");
        setIsOpen(false);

        if (syncedQuery && !onSearch) {
            goTo(REPORTS_PATH);
        }
    };

    return {
        query,
        status,
        suggestions,
        showDropdown,
        isNavigating,
        handleInputChange,
        openDropdown,
        closeDropdown,
        handleSubmit,
        openIssue,
        fillQuery,
        searchFor,
        clearQuery,
    };
}

export type ReportSearchState = ReturnType<typeof useReportSearch>;