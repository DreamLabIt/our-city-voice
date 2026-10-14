"use server";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import { posts as mockPosts } from "@/data/mock-data";
import type { Report } from "@/types/report";
import type { SearchSuggestionsResponse, SearchResultsResponse } from "@/types/search";

const MAX_SUGGESTIONS = 6;

function matchesTerm(report: Report, term: string): boolean {
    const query = term.toLowerCase();

    return [report.trackingCode, report.title, report.address].some((value) =>
        (value ?? "").toLowerCase().includes(query),
    );
}

function getMockSuggestions(term: string): SearchSuggestionsResponse {
    const suggestions = mockPosts
        .filter((report) => matchesTerm(report, term))
        .slice(0, MAX_SUGGESTIONS)
        .map((report) => ({
            trackingCode: report.trackingCode,
            title: report.title,
            address: report.address ?? "",
        }));

    return { suggestions };
}

function getMockResults(
    term: string,
    page: number,
    limit: number,
): SearchResultsResponse {
    const matched = mockPosts.filter((report) => matchesTerm(report, term));
    const start = (page - 1) * limit;

    return {
        posts: matched.slice(start, start + limit),
        total: matched.length,
        page,
        limit,
        pageCount: Math.ceil(matched.length / limit),
    };
}
export async function getSearchSuggestions(
    searchTerm: string,
): Promise<SearchSuggestionsResponse> {
    const trimmed = searchTerm.trim();

    if (trimmed.length < 2) {
        return { suggestions: [] };
    }

    try {
        const result = await apiFetch<SearchSuggestionsResponse>(
            `/posts/suggestions?search=${encodeURIComponent(trimmed)}`,
            {
                method: "GET",
            },
        );

        if (!result.ok) {
            return getMockSuggestions(trimmed);
        }

        return result.data ?? { suggestions: [] };
    } catch (error) {
        console.error("Error in getSearchSuggestions server action:", error);
        return getMockSuggestions(trimmed);
    }
}

export async function getSearchResults(
    searchTerm: string,
    page = 1,
    limit = 6,
): Promise<SearchResultsResponse | null> {
    const trimmed = searchTerm.trim();

    if (trimmed.length < 2) {
        return null;
    }

    const token = await getAccessToken();

    try {
        const queryParams = new URLSearchParams({
            search: trimmed,
            page: page.toString(),
            limit: limit.toString(),
        });

        const result = await apiFetch<SearchResultsResponse>(
            `/posts/search?${queryParams.toString()}`,
            {
                method: "GET",
                token: token?.trim(),
                forward: await clientForwardHeaders(),
            },
        );

        if (!result.ok) {
            return getMockResults(trimmed, page, limit);
        }

        return result.data ?? null;
    } catch (error) {
        console.error("Error in getSearchResults server action:", error);
        return getMockResults(trimmed, page, limit);
    }
}