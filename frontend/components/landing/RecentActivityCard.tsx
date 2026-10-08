import { getReports } from "@/app/actions/report";
import RecentActivityCardClient from "./RecentActivityCardClient";
import type { Report } from "@/types/report";

export default function RecentActivityCard() {
    return <RecentActivityContent />;
}

async function RecentActivityContent() {
    const reportsData = await getReports({ page: 1, limit: 4 }).catch((err) => {
        console.error("Failed to fetch reports:", err);
        return null;
    });
    const reports = (reportsData as (typeof reportsData & { reports?: Report[] }) | null)?.reports;

    const allReports: Report[] = Array.isArray(reportsData?.posts)
        ? reportsData.posts
        : Array.isArray(reports)
            ? reports
            : Array.isArray(reportsData)
                ? reportsData
                : [];

    return <RecentActivityCardClient initialReports={allReports} />;
}