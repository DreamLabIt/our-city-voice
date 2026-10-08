"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageSquare, ThumbsUp, Eye, Play, Video, Pause } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Report } from "@/types/report";

export default function PostCard({ post }: { post: Report }): React.ReactNode {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const initialDurationSecs = post.media?.durationSecs || 0;
    const [durationSecs, setDurationSecs] = useState<number>(initialDurationSecs);
    const detailsHref = `/issues/${post.trackingCode || post.id}`;
    const mediaImage = post.media?.image || "/placeholder-image.jpg";
    const mediaVideo = post.media?.video;
    const hasVideo = Boolean(mediaVideo);
    const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const locationText = post.location
        ? [post.location.street, post.location.city].filter(Boolean).join(", ") || post.location.address
        : "N/A";

    const minutes = Math.floor(durationSecs / 60);
    const seconds = Math.floor(durationSecs % 60);
    const durationString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    const handleVideoPlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

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
        if (videoRef.current && !initialDurationSecs) {
            setDurationSecs(videoRef.current.duration);
        }
    };

    return (
        <Card className="rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group border-border p-0">
            {hasVideo ? (
                <div className="relative w-full h-40 bg-muted overflow-hidden group/media">
                    <video
                        ref={videoRef}
                        src={mediaVideo ?? undefined}
                        poster={mediaImage}
                        onClick={handleVideoPlay}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        className="w-full h-full object-cover cursor-pointer transition-transform duration-100 group-hover/media:scale-[1.01]"
                    />

                    <Badge
                        variant="secondary"
                        className="absolute bottom-2 right-2 bg-black/75 text-white hover:bg-black/80 text-[14px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-xs z-10 border-0 pointer-events-none"
                    >
                        <span>{durationString}</span>
                        <Video className="w-4 h-4 fill-current" />
                    </Badge>

                    <div
                        className={`absolute inset-0 bg-black/25 transition-opacity flex items-center justify-center ${isPlaying ? "opacity-0 hover:opacity-100" : "opacity-0 group-hover/media:opacity-100"
                            }`}
                    >
                        <Button
                            size="icon"
                            variant="secondary"
                            onClick={handleVideoPlay}
                            aria-label={isPlaying ? `Pause video for ${post.title}` : `Play video for ${post.title}`}
                            className="w-10 h-10 rounded-full bg-white/90 text-primary hover:bg-white shadow-lg transform scale-90 group-hover/media:scale-100 transition-transform cursor-pointer"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <Link
                    href={detailsHref}
                    aria-label={`View details for ${post.title}`}
                    className="relative block w-full h-40 bg-muted overflow-hidden group/media"
                >
                    <Image
                        src={mediaImage}
                        alt={post.title}
                        width={400}
                        height={200}
                        className="w-full h-full object-cover transition-transform duration-100 group-hover/media:scale-[1.01]"
                    />
                </Link>
            )}

            <Link href={detailsHref} className="flex flex-col justify-between flex-1">
                <CardContent className="p-0">
                    <div className="p-3.5 space-y-4">
                        <div className="flex items-center justify-between text-[15px]">
                            <span className="font-bold text-primary">{post.trackingCode}</span>
                            <span className="text-muted-foreground font-medium">{formattedDate}</span>
                        </div>

                        <div>
                            <Badge
                                variant="outline"
                                className="text-[14px] px-2.5 py-0.5 rounded-md border-0 bg-primary/10 text-primary font-semibold"
                            >
                                {post.category?.name || "General"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-foreground/80 shrink-0" />
                            <span className="truncate font-medium">{locationText}</span>
                        </div>

                        <h3 className="text-[16px] font-semibold text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors">
                            {post.title}
                        </h3>
                        <p className="text-[14px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.description}
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex items-center gap-4 text-[16px] text-muted-foreground font-medium border-t-0 w-full">
                    <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <span>{post.counts?.comments ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ThumbsUp className="w-5 h-5 text-muted-foreground" />
                        <span>{post.counts?.likes ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                        <span>{post.counts?.views ?? 0}</span>
                    </div>
                </CardFooter>
            </Link>
        </Card>
    );
}