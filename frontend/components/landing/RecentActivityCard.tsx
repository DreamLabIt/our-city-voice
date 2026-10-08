import RecentActivityCardClient from "./RecentActivityCardClient";
import type { RecentActivityCardProps } from "@/types/report";

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
    return <RecentActivityCardClient initialReports={activities} />;
}