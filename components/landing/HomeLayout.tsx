"use client";

import CommunityActivity from "./CommunityActivity";
import FilterPostsCard from "./FilterPostsCard";
import RecentActivityCard from "./RecentActivityCard";
import RecentPosts from "./RecentPosts";

export default function HomeLayout() {
    return (
        <section className="w-full py-6 sm:py-8">
            <div className="max-w-[1940px] mx-auto px-4 sm:px-8 md:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        <div className="w-full">
                            <CommunityActivity />
                        </div>
                        <div className="w-full">
                            <RecentPosts />
                        </div>
                    </div>

                    <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                        <FilterPostsCard />
                        <RecentActivityCard />
                    </div>

                </div>
            </div>
        </section>
    );
}