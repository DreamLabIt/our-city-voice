import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import IssueDetails from "@/components/issues/IssueDetails/IssueDetails";
import SectionContainer from "@/components/common/SectionContainer";
import {
    getReportByCode,
    getReportComments,
} from "@/app/actions/report";
import type { IssuePageProps } from "@/types/IssueDetails";
import ViewTrackerServerSync from "@/components/issues/IssueDetails/ViewTrackerClient";

export const revalidate = 60;

export default async function IssuePage({
    params,
}: IssuePageProps): Promise<React.ReactNode> {
    const { id } = await params;

    const cookieStore = await cookies();
    const viewedCookie = cookieStore.get("viewed_report_codes")?.value;

    let viewedCodes: string[] = [];
    try {
        viewedCodes = viewedCookie ? JSON.parse(viewedCookie) : [];
    } catch {
        viewedCodes = [];
    }

    const hasViewedBefore = viewedCodes.includes(id);

    const countView = !hasViewedBefore;

    const [reportRes, commentsRes] = await Promise.all([
        getReportByCode(id, { countView })
            .then((data) => ({ data, failed: false as const }))
            .catch(() => ({ data: null, failed: true as const })),
        getReportComments(id, { limit: 10 })
            .then((data) => ({ data, failed: false as const }))
            .catch(() => ({ data: null, failed: true as const })),
    ]);

    let post = reportRes.data?.post;
    let related = reportRes.data?.related ?? [];
    let comments = commentsRes.data?.comments ?? [];

    if (!post) {
        notFound();
    }

    return (
        <SectionContainer>
            <ViewTrackerServerSync code={id} currentViewed={viewedCodes} />
            <IssueDetails
                post={post}
                comments={comments}
                relatedPosts={related}
            />
        </SectionContainer>
    );
}