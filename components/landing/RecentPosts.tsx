"use client";

import React, { useState } from "react";
import { MapPin, MessageSquare, ThumbsUp, Eye, Play, Video } from "lucide-react";
import Image from "next/image";

export interface PostItem {
    id: string;
    code: string;
    date: string;
    tag: string;
    tagBg: string;
    tagText: string;
    location: string;
    title: string;
    desc: string;
    comments: number;
    likes: number;
    views: number;
    image: string;
    isVideo?: boolean;
    duration?: string;
    category: "Latest" | "Most Commented" | "Nearby" | "Map View";
}

export default function RecentPosts(): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<string>("Latest");

    const tabs: string[] = ["Latest", "Most Commented", "Nearby", "Map View"];

    const posts: PostItem[] = [
        {
            id: "1",
            code: "#2024-001245",
            date: "Oct 26, 2026",
            tag: "Roads",
            tagBg: "bg-[#e0f2fe]",
            tagText: "text-[#0284c7]",
            location: "Finch Ave E, Scarborough",
            title: "Large pothole causing traffic issues",
            desc: "This pothole has been getting bigger and is causing vehicle damage.",
            comments: 12,
            likes: 8,
            views: 245,
            image: "/road_surface .jpeg",
            isVideo: true,
            duration: "0:32",
            category: "Latest",
        },
        {
            id: "2",
            code: "#2024-001244",
            date: "Oct 26, 2026",
            tag: "Stormwater & Flooding",
            tagBg: "bg-[#e0f2fe]",
            tagText: "text-[#0284c7]",
            location: "Morningside Ave, Scarborough",
            title: "Flooding during heavy rain",
            desc: "Water is not draining properly on this street after rain.",
            comments: 7,
            likes: 5,
            views: 180,
            image: "/residential_street.jpeg",
            category: "Most Commented",
        },
        {
            id: "3",
            code: "#2024-001243",
            date: "Oct 25, 2026",
            tag: "Sidewalks",
            tagBg: "bg-[#dcfce7]",
            tagText: "text-[#15803d]",
            location: "Sheppard Ave W, North York",
            title: "Broken sidewalk near bus stop",
            desc: "The sidewalk is cracked and unsafe for pedestrians.",
            comments: 3,
            likes: 6,
            views: 95,
            image: "/uneven_concrete.jpeg",
            category: "Nearby",
        },
        {
            id: "4",
            code: "#2024-001242",
            date: "Oct 24, 2026",
            tag: "Streetlights & Signals",
            tagBg: "bg-[#fef3c7]",
            tagText: "text-[#b45309]",
            location: "Markham Rd, Scarborough",
            title: "Streetlight not working",
            desc: "This streetlight has been out for over a week.",
            comments: 4,
            likes: 3,
            views: 120,
            image: "/street_light.jpeg",
            category: "Map View",
        },
    ];

    const filteredPosts =
        activeTab === "Latest"
            ? posts
            : posts.filter((post) => post.category === activeTab);

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs ">
            <div className="flex items-start justify-start border-b border-slate-200/60  gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
                <h2 className="text-base font-bold text-[#0f172a]">
                    Recent Posts
                </h2>
                <div className="flex items-center gap-6 overflow-x-auto ">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`text-md font-semibold relative pb-2.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab
                                ? "text-[#1d63ed]"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1d63ed] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 min-h-110">                {filteredPosts.map((post) => (
                <div
                    key={post.id}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all flex flex-col justify-between group"
                >
                    <div>
                        <div className="relative w-full h-40 bg-slate-100 overflow-hidden cursor-pointer">
                            <Image
                                src={post.image}
                                alt={post.title}
                                width={100}
                                height={100}
                                className="w-full h-full  group-hover:scale-101 transition-transform duration-100"
                            />

                            {post.isVideo && (
                                <>
                                    <div className="absolute bottom-0 right-2 bg-black/75 text-white text-[16px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-xs z-10">
                                        <span>{post.duration}</span>
                                        <Video className="w-4 h-4 fill-current" />
                                    </div>

                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/90 text-[#1d63ed] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-[15px]">
                                <span className="font-bold text-[#1d63ed]">
                                    {post.code}
                                </span>
                                <span className="text-slate-400 font-medium">
                                    {post.date}
                                </span>
                            </div>

                            <div>
                                <span
                                    className={`inline-block text-[14px] px-2.5 py-0.5 rounded-md ${post.tagBg} ${post.tagText}`}
                                >
                                    {post.tag}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-[14px] text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                <span className="truncate font-medium">{post.location}</span>
                            </div>

                            <h3 className="text-[16px] font-semibold text-slate-900 line-clamp-1 leading-snug">
                                {post.title}
                            </h3>
                            <p className="text-[14px] text-slate-500 line-clamp-2 leading-relaxed min-h-8">
                                {post.desc}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center gap-4 text-[16px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer">
                            <MessageSquare className="w-5 h-5 text-slate-500" />
                            <span>{post.comments}</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer">
                            <ThumbsUp className="w-5 h-5 text-slate-500" />
                            <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            <Eye className="w-5 h-5 text-slate-500" />
                            <span>{post.views}</span>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}