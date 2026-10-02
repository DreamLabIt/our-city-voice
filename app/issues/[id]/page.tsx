import type { Metadata } from "next";
import { notFound } from "next/navigation";

import IssueDetails from "@/components/issues/IssueDetails";
import { postComments, posts } from "@/data/mock-data";

interface IssuePageProps {
    params: Promise<{ id: string }>;
}

export function generateStaticParams() {
    return posts.map((post) => ({ id: post.id }));
}

export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
    const { id } = await params;
    const post = posts.find((item) => item.id === id);

    if (!post) {
        return { title: "Issue not found - OurCityVoice" };
    }

    return {
        title: `${post.title} (${post.code}) - OurCityVoice`,
        description: post.desc,
    };
}

export default async function IssuePage({ params }: IssuePageProps): Promise<React.ReactNode> {
    const { id } = await params;
    const post = posts.find((item) => item.id === id);

    if (!post) notFound();

    const comments = postComments.filter((comment) => comment.postId === post.id);

    const sameCategory = posts.filter((item) => item.id !== post.id && item.tag === post.tag);
    const otherIssues = posts.filter(
        (item) => item.id !== post.id && !sameCategory.some((match) => match.id === item.id)
    );
    const relatedPosts = [...sameCategory, ...otherIssues].slice(0, 4);

    return <IssueDetails post={post} comments={comments} relatedPosts={relatedPosts} />;
}
