"use client";

import { useEffect } from "react";

const STORAGE_KEY = "viewed_report_codes";

export function shouldIncrementView(code: string): boolean {
    if (typeof window === "undefined") return false;

    try {
        const viewedCodes: string[] = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (viewedCodes.includes(code)) {
            return false;
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([...viewedCodes, code])
        );
        return true;
    } catch (e) {
        console.error("Error accessing localStorage:", e);
        return false;
    }
}

export default function ViewTrackerClient({ code }: { code: string }) {
    useEffect(() => {
        shouldIncrementView(code);
    }, [code]);

    return null;
}