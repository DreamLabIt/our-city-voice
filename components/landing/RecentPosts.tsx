"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { MapPin, MessageSquare, ThumbsUp, Eye, Play, Video, Pause } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        if (!videoRef.current) return;

        const totalSeconds = Math.floor(videoRef.current.duration);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

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
                {filteredPosts.map((post) => (
                    <Card
                        key={post.id}
                        className="rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group border-border p-0"
                    >
                        <CardContent className="p-0">
                            {/* Media Section */}
                            <div className="relative w-full h-40 bg-muted overflow-hidden cursor-pointer group">
                                {post.isVideo && post.video ? (
                                    <video
                                        ref={videoRef}
                                        src={post.video}
                                        poster={post.image}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onEnded={() => setIsPlaying(false)}
                                        className="w-full h-full object-cover transition-transform duration-100 group-hover:scale-[1.01]"
                                    />
                                ) : (
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        width={400}
                                        height={200}
                                        className="w-full h-full object-cover transition-transform duration-100 group-hover:scale-[1.01]"
                                    />
                                )}

                                {post.isVideo && (
                                    <>
                                        <Badge
                                            variant="secondary"
                                            className="absolute bottom-2 right-2 bg-black/75 text-white hover:bg-black/80 text-[14px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-xs z-10 border-0"
                                        >
                                            <span>{duration}</span>
                                            <Video className="w-4 h-4 fill-current" />
                                        </Badge>

                                        <div
                                            onClick={handleVideoPlay}
                                            className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="w-10 h-10 rounded-full bg-white/90 text-primary hover:bg-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-5 h-5 fill-current" />
                                                ) : (
                                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-3.5 space-y-4">
                                <div className="flex items-center justify-between text-[15px]">
                                    <span className="font-bold text-primary">{post.code}</span>
                                    <span className="text-muted-foreground font-medium">{post.date}</span>
                                </div>

                                <div>
                                    <Badge
                                        variant="outline"
                                        className={`text-[14px] px-2.5 py-0.5 rounded-md border-0 ${post.tagBg} ${post.tagText}`}
                                    >
                                        {post.tag}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5 text-foreground/80 shrink-0" />
                                    <span className="truncate font-medium">{post.location}</span>
                                </div>

                                <h3 className="text-[16px] font-semibold text-foreground line-clamp-1 leading-snug">
                                    {post.title}
                                </h3>
                                <p className="text-[14px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {post.desc}
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0 flex items-center gap-4 text-[16px] text-muted-foreground font-medium border-t-0 bg-width">
                            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                <span>{post.comments}</span>
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                                <ThumbsUp className="w-5 h-5 text-muted-foreground" />
                                <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-auto">
                                <Eye className="w-5 h-5 text-muted-foreground" />
                                <span>{post.views}</span>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </Card>
    );
}