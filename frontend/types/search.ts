import type { Report } from "./report";
import type { ReportSearchState } from "@/hooks/use-report-search";

export interface ReportSuggestion {
    trackingCode: string;
    title: string;
    address: string;
}

export interface SearchSuggestionsResponse {
    suggestions: ReportSuggestion[];
}

export interface SearchResultsResponse {
    posts: Report[];
    total: number;
    page: number;
    limit: number;
    pageCount: number;
}

export interface DraftFilters {
    category: string;
    status: string;
    ward: string;
}

export interface ReportSearchInputProps {
    search: ReportSearchState;
}

export interface SearchResultsProps {
    term: string;
    initialData: SearchResultsResponse | null;
}

export interface SuggestionResult {
    term: string;
    suggestions: ReportSuggestion[];
}

export interface UseReportSearchOptions {
    syncedQuery?: string;
    clearOnEmptySubmit?: boolean;
    resetQueryOnNavigate?: boolean;
    onNavigate?: () => void;
    onSearch?: (term: string) => void;
    enabled?: boolean;
}