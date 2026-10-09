import IssueDetails from "@/components/issues/IssueDetails/IssueDetails";
import SectionContainer from "@/components/common/SectionContainer";
import {
    getReportByCode,
    getReportComments,
} from "@/app/actions/report";
import type { IssuePageProps } from "@/types/IssueDetails";

export const revalidate = 60;

export default async function IssuePage({
    params,
}: IssuePageProps): Promise<React.ReactNode> {
    const { id } = await params;

    const [reportData, reportComments] = await Promise.all([
        getReportByCode(id),
        getReportComments(id, { limit: 20 }).catch(() => ({
            comments: [],
        })),
    ]);

    return (
        <SectionContainer>
            <IssueDetails
                post={reportData.post}
                comments={reportComments.comments}
                relatedPosts={reportData.related}
            />
        </SectionContainer>
    );
}
