"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, type ApiResult } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type {
    ReportListResponse,
    ReportFiltersResponse,
    ReportDetailResponse,
    ReportCommentsResponse,
    GetReportsParams,
    GetReportCommentsParams,
} from "@/types/report";

function appendQueryParam(
    params: URLSearchParams,
    key: string,
    value: string | string[] | undefined
) {
    if (value === undefined || value === null || value === "") {
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            if (item) {
                params.append(key, item);
            }
        }
        return;
    }

    params.set(key, String(value));
}

function buildReportQuery(params: GetReportsParams = {}) {
    const query = new URLSearchParams();

    if (params.page !== undefined) {
        query.set("page", String(params.page));
    }

    if (params.limit !== undefined) {
        query.set("limit", String(params.limit));
    }

    if (params.sort !== undefined) {
        query.set("sort", params.sort);
    }

    if (params.search !== undefined) {
        query.set("search", params.search);
    }

    appendQueryParam(query, "category", params.category);
    appendQueryParam(query, "ward", params.ward);
    appendQueryParam(query, "status", params.status);
    appendQueryParam(query, "priority", params.priority);

    if (params.mine !== undefined) {
        query.set("mine", String(params.mine));
    }

    if (params.authorId !== undefined) {
        query.set("authorId", params.authorId);
    }

    if (params.includeDeleted !== undefined) {
        query.set("includeDeleted", String(params.includeDeleted));
    }

    return query;
}

function handleApiResult<T>(res: ApiResult<T>): T {
    if (!res.ok) {
        throw new Error(
            res.error?.message || "An unexpected error occurred."
        );
    }

    return res.data;
}

export async function getReports(
    params: GetReportsParams = {}
): Promise<ReportListResponse> {
    const query = buildReportQuery(params);
    const queryString = query.toString();

    const token = await getAccessToken();
    const headers = await clientForwardHeaders();

    const res = await apiFetch<ReportListResponse>(
        `/posts${queryString ? `?${queryString}` : ""}`,
        {
            token,
            forward: headers,
        }
    );

    return handleApiResult(res);
}

export async function getReportFilters(): Promise<ReportFiltersResponse> {
    const headers = await clientForwardHeaders();

    const res = await apiFetch<ReportFiltersResponse>(
        "/posts/filters",
        {
            forward: headers,
        }
    );

    return handleApiResult(res);
}

export async function getReportByCode(
    code: string,
    options?: {
        includeDeleted?: boolean;
    }
): Promise<ReportDetailResponse> {
    const token = await getAccessToken();
    const headers = await clientForwardHeaders();

    const query = new URLSearchParams();

    if (options?.includeDeleted !== undefined) {
        query.set(
            "includeDeleted",
            String(options.includeDeleted)
        );
    }

    const queryString = query.toString();

    const res = await apiFetch<ReportDetailResponse>(
        `/posts/${encodeURIComponent(code)}${queryString ? `?${queryString}` : ""}`,
        {
            token,
            forward: headers,
        }
    );

    return handleApiResult(res);
}

export async function getReportComments(
    code: string,
    params: GetReportCommentsParams = {}
): Promise<ReportCommentsResponse> {
    const query = new URLSearchParams();

    if (params.page !== undefined) {
        query.set("page", String(params.page));
    }

    if (params.limit !== undefined) {
        query.set("limit", String(params.limit));
    }

    const queryString = query.toString();

    const token = await getAccessToken();
    const headers = await clientForwardHeaders();

    const res = await apiFetch<ReportCommentsResponse>(
        `/posts/${encodeURIComponent(code)}/comments${queryString ? `?${queryString}` : ""
        }`,
        {
            token,
            forward: headers,
        }
    );

    return handleApiResult(res);
}

export async function getMyReports(
    params: Omit<GetReportsParams, "mine" | "authorId"> = {}
): Promise<ReportListResponse> {
    return getReports({
        ...params,
        mine: true,
    });
}

export async function getReportsByAuthor(
    authorId: string,
    params: Omit<GetReportsParams, "mine" | "authorId"> = {}
): Promise<ReportListResponse> {
    return getReports({
        ...params,
        authorId,
    });
}

export async function getReportsIncludingDeleted(
    params: Omit<GetReportsParams, "includeDeleted"> = {}
): Promise<ReportListResponse> {
    return getReports({
        ...params,
        includeDeleted: true,
    });
}

export async function revalidateReportCache(
    path: string = "/reports"
) {
    revalidatePath(path);
}