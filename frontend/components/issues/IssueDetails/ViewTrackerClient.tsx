"use client";

import { useEffect } from "react";

const COOKIE_NAME = "viewed_report_codes";

export default function ViewTrackerServerSync({
    code,
    currentViewed,
}: {
    code: string;
    currentViewed: string[];
}) {
    useEffect(() => {
        if (!currentViewed.includes(code)) {
            const updated = [...currentViewed, code];
            document.cookie = `${COOKIE_NAME}=${JSON.stringify(
                updated
            )}; path=/; max-age=31536000; SameSite=Lax`;

            try {
                const ls = JSON.parse(localStorage.getItem("viewed_report_codes") || "[]");
                if (!ls.includes(code)) {
                    localStorage.setItem("viewed_report_codes", JSON.stringify([...ls, code]));
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, [code, currentViewed]);

    return null;
}