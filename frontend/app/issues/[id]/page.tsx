import { notFound } from "next/navigation";
import IssueDetails from "@/components/issues/IssueDetails/IssueDetails";
import SectionContainer from "@/components/common/SectionContainer";
import {
    getReportByCode,
    getReportComments,
} from "@/app/actions/report";
import {
    posts as mockPosts,
    initialReports as mockReports,
    postComments as mockComments,
} from "@/data/mock-data";
import type { IssuePageProps } from "@/types/IssueDetails";

export const revalidate = 60;

const allMockReports = [...mockPosts, ...mockReports];

export default async function IssuePage({
    params,
}: IssuePageProps): Promise<React.ReactNode> {
    const { id } = await params;

    const [reportRes, commentsRes] = await Promise.all([
        getReportByCode(id)
            .then((data) => ({ data, failed: false as const }))
            .catch(() => ({ data: null, failed: true as const })),
        getReportComments(id, { limit: 10 })
            .then((data) => ({ data, failed: false as const }))
            .catch(() => ({ data: null, failed: true as const })),
    ]);

    let post = reportRes.data?.post;
    let related = reportRes.data?.related ?? [];
    let comments = commentsRes.data?.comments ?? [];

    if (!post && reportRes.failed) {
        const mockPost = allMockReports.find(
            (p) => p.id === id || p.trackingCode === id
        );

        if (mockPost) {
            post = { ...mockPost, timeline: [] };
            related = allMockReports
                .filter((p) => p.id !== mockPost.id)
                .slice(0, 3);

            comments = mockComments.filter((c) => c.postId === mockPost.id);
        }
    }

    if (!post) {
        notFound();
    }

    return (
        <SectionContainer>
            <IssueDetails
                post={post}
                comments={comments}
                relatedPosts={related}
            />
        </SectionContainer>
    );
}