"use client";

import React, { useState } from "react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "./PostCard";

import { posts, tabs } from "@/data/mock-data";

export default function RecentPosts(): React.ReactNode {
    const [activeTab, setActiveTab] = useState<string>("Latest");

    const filteredPosts = (
        activeTab === "Latest"
            ? posts
            : posts.filter((post) => post.category === activeTab)
    ).slice(0, 4);

    return (
        <Card className="w-full p-5 rounded-2xl ">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start border-b border-border pb-3 gap-4 overflow-x-auto">
                <h2 className="text-base font-bold text-foreground shrink-0">Recent Posts</h2>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-transparent h-auto p-0 gap-4 sm:gap-6 justify-start overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="px-0 py-1.5 text-md font-semibold text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all whitespace-nowrap"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2 mb-6">
                {/* testing parpas */}
                {filteredPosts.length > 10 ? (
                    filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <div className="col-span-full flex min-h-108 items-center justify-center rounded-2xl border border-border-custom bg-section">
                        <p className="text-sm text-muted-foreground">
                            No Data Available
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
