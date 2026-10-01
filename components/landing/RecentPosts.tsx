"use client";

import React, { useRef, useState } from "react";
import { MapPin, MessageSquare, ThumbsUp, Eye, Play, Video, Pause } from "lucide-react";
import Image from "next/image";
import { posts, tabs } from "@/data/mock-data";

export default function RecentPosts(): React.ReactNode {
    const [activeTab, setActiveTab] = useState<string>("Latest");

    const filteredPosts =
        activeTab === "Latest" ? posts : posts.filter((post) => post.category === activeTab);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [duration, setDuration] = useState("0:00");
    const [isPlaying, setIsPlaying] = useState(false);

    const handleVideoPlay = () => {
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleLoadedMetadata = () => {
        console.log("Video metadata loaded", videoRef.current);
        if (!videoRef.current) return;

        const totalSeconds = Math.floor(videoRef.current.duration);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    return (
        <div className="w-full bg-card rounded-2xl border border-border-custom p-5 shadow-xs">
            <div className="flex items-start justify-start border-b border-border-custom/60 gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
                <h2 className="text-base font-bold text-foreground">Recent Posts</h2>
                <div className="flex items-center gap-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`text-md font-semibold relative pb-2.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab
                                ? "text-primary"
                                : "text-muted hover:text-foreground"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 min-h-110">
                {filteredPosts.map((post) => (
                    <div
                        key={post.id}
                        className="border border-border-custom rounded-2xl overflow-hidden bg-card hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="relative w-full h-40 bg-slate-100 overflow-hidden cursor-pointer group">
                                {post.isVideo && post.video ? (
                                    <video
                                        ref={videoRef}
                                        src={post.video}
                                        poster={post.image}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onEnded={() => setIsPlaying(false)}
                                        className="w-full h-full object-cover transition-transform duration-100 group-hover:scale-101"
                                    />
                                ) : (
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        width={100}
                                        height={100}
                                        className="w-full h-full object-cover transition-transform duration-100 group-hover:scale-101"
                                    />
                                )}

                                {post.isVideo && (
                                    <>
                                        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[16px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-xs z-10">
                                            <span>{duration}</span>
                                            <Video className="w-4 h-4 fill-current" />
                                        </div>

                                        <div
                                            onClick={handleVideoPlay}
                                            className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                {isPlaying ? (
                                                    <Pause className="w-5 h-5 fill-current" />
                                                ) : (
                                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-3.5 space-y-2">
                                <div className="flex items-center justify-between text-[15px]">
                                    <span className="font-bold text-primary">{post.code}</span>
                                    <span className="text-muted font-medium">{post.date}</span>
                                </div>

                                <div>
                                    <span
                                        className={`inline-block text-[14px] px-2.5 py-0.5 rounded-md ${post.tagBg} ${post.tagText}`}
                                    >
                                        {post.tag}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 text-[14px] text-muted">
                                    <MapPin className="w-3.5 h-3.5 text-foreground/80 shrink-0" />
                                    <span className="truncate font-medium">{post.location}</span>
                                </div>

                                <h3 className="text-[16px] font-semibold text-foreground line-clamp-1 leading-snug">
                                    {post.title}
                                </h3>
                                <p className="text-[14px] text-muted line-clamp-2 leading-relaxed min-h-8">
                                    {post.desc}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 pt-0 flex items-center gap-4 text-[16px] text-muted font-medium">
                            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                                <MessageSquare className="w-5 h-5 text-muted" />
                                <span>{post.comments}</span>
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                                <ThumbsUp className="w-5 h-5 text-muted" />
                                <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-auto">
                                <Eye className="w-5 h-5 text-muted" />
                                <span>{post.views}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
