"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "./PostCard";
import type { RecentPostsClientProps } from "@/types/report";
import PostsSkeleton from "../skeleton/PostsSkeleton";

export default function RecentPostsClient({
    initialPosts,
    tabs,
}: RecentPostsClientProps) {
    const [activeTab, setActiveTab] = useState<string>("Latest");

    const filteredPosts = (
        activeTab === "Latest"
            ? initialPosts
            : initialPosts.filter(
                (post) => post.category?.name === activeTab
            )
    ).slice(0, 4);

    return (
        <Card className="w-full p-5 rounded-2xl border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start border-b border-border pb-3 gap-4">
                <h2 className="text-base font-bold text-foreground shrink-0">
                    Recent Posts
                </h2>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full sm:w-auto min-w-0"
                >
                    <TabsList className="bg-transparent h-auto p-0 gap-4 sm:gap-6 justify-start overflow-x-auto w-full sm:w-auto flex-nowrap scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="px-2 py-1.5 text-md font-semibold text-muted-foreground bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="pt-4 mb-8">
                {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <PostsSkeleton />
                )}
            </div>
        </Card>
    );
}

