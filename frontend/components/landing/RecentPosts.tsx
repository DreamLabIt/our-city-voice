import RecentPostsClient from "./RecentPostsClient";
import type { RecentPostsProps } from "@/types/report";

export default function RecentPosts({ initialPosts, tabs }: RecentPostsProps) {
    return <RecentPostsClient initialPosts={initialPosts} tabs={tabs} />;
}