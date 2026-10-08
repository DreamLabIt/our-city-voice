"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    MapPin,
    MessageSquare,
    Play,
    Share2,
    ThumbsUp,
    User,
    Video,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
    CARD_CLASS,
    formatDate,
    PRIORITY_LABEL,
    PRIORITY_STYLES,
    STATUS_LABEL,
    STATUS_STYLES,
} from "@/lib/utils";

import type { MediaItem, PostProps } from "@/types/IssueDetails"

export default function Post({ post }: PostProps): React.ReactNode {
    const { media } = post;

    const mediaItems = useMemo(() => {
        const items: MediaItem[] = [];

        const image =
            typeof media.image === "string" && media.image.trim()
                ? media.image.trim()
                : undefined;

        const video =
            typeof media.video === "string" && media.video.trim()
                ? media.video.trim()
                : undefined;

        if (video) {
            items.push({
                type: "video",
                src: video,
                poster: image,
            });
        }

        media.gallery.forEach((item) => {
            if (!item.url) return;

            if (items.some((mediaItem) => mediaItem.src === item.url)) {
                return;
            }

            items.push({
                type: item.type,
                src: item.url,
                poster: item.thumbnailUrl ?? undefined,
            });
        });

        if (image && !items.some((item) => item.src === image)) {
            items.push({
                type: "image",
                src: image,
            });
        }

        return items;
    }, [media]);

    const [activeMedia, setActiveMedia] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const current = mediaItems[activeMedia];

    const handleVideoPlay = () => {
        const video = videoRef.current;

        if (!video) return;

        if (video.paused) {
            void video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleSelectMedia = (index: number) => {
        if (index === activeMedia) return;

        videoRef.current?.pause();
        setIsPlaying(false);
        setActiveMedia(index);
    };

    const [likes, setLikes] = useState(post.counts.likes);
    const [hasLiked, setHasLiked] = useState(post.likedByMe);

    const handleLike = () => {
        if (hasLiked) {
            setLikes((prev) => prev - 1);
            setHasLiked(false);

            toast.info("Support removed");
        } else {
            setLikes((prev) => prev + 1);
            setHasLiked(true);

            toast.success("Thanks for supporting this report!", {
                description:
                    "Issues with more community support get prioritized sooner.",
            });
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);

            toast.success("Link copied", {
                description: "Share it with your neighbours.",
            });
        } catch {
            toast.error("Could not copy the link", {
                description: "Copy it from the address bar instead.",
            });
        }
    };

    const paragraphs = post.description
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    return (
        <div className="space-y-6">
            {current && (
                <Card className={cn(CARD_CLASS, "overflow-hidden")}>
                    <div className="relative w-full h-56 sm:h-80 md:h-150 bg-muted">
                        {current.type === "video" ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={current.src}
                                    poster={current.poster}
                                    controls
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                    className="w-full h-full object-cover cursor-pointer"
                                />

                                {!isPlaying && (
                                    <button
                                        type="button"
                                        onClick={handleVideoPlay}
                                        aria-label={`Play video for ${post.title}`}
                                        className="absolute inset-0 bg-black/25 flex items-center justify-center cursor-pointer"
                                    >
                                        <span className="w-14 h-14 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg">
                                            <Play className="w-6 h-6 fill-current ml-0.5" />
                                        </span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <Image
                                src={current.src}
                                alt={post.title}
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 66vw"
                                className="object-cover"
                            />
                        )}

                        <Badge
                            variant="outline"
                            className={cn(
                                "absolute top-3 left-3 z-10 rounded-lg px-2.5 py-1 text-[11px] font-extrabold backdrop-blur-md",
                                STATUS_STYLES[post.status],
                            )}
                        >
                            {STATUS_LABEL[post.status]}
                        </Badge>

                        <Badge
                            variant="outline"
                            className={cn(
                                "absolute top-3 right-3 z-10 gap-1 rounded-lg px-2.5 py-1 text-[11px] font-extrabold backdrop-blur-md",
                                PRIORITY_STYLES[post.priority],
                            )}
                        >
                            <AlertTriangle className="w-3 h-3" />{" "}
                            {PRIORITY_LABEL[post.priority]} priority
                        </Badge>
                    </div>

                    {mediaItems.length > 1 && (
                        <div className="flex gap-2.5 p-3 overflow-x-auto no-scrollbar">
                            {mediaItems.map((item, index) => (
                                <button
                                    key={`${item.src}-${index}`}
                                    type="button"
                                    onClick={() => handleSelectMedia(index)}
                                    aria-label={`Show ${item.type} ${index + 1
                                        } of ${mediaItems.length}`}
                                    className={cn(
                                        "relative w-20 h-16 sm:w-24 sm:h-18 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-muted",
                                        index === activeMedia
                                            ? "border-primary"
                                            : "border-transparent hover:border-border-custom opacity-80 hover:opacity-100",
                                    )}
                                >
                                    {item.type === "image" ? (
                                        <Image
                                            src={item.src}
                                            alt=""
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                        />
                                    ) : item.poster ? (
                                        <Image
                                            src={item.poster}
                                            alt=""
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                        />
                                    ) : null}

                                    {item.type === "video" && (
                                        <span className="absolute inset-0 bg-black/35 flex items-center justify-center text-white">
                                            <Video className="w-4 h-4 fill-current" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            <Card className={CARD_CLASS}>
                <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-mono font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-md text-xs">
                            {post.trackingCode}
                        </span>

                        <Badge className="rounded-md border-transparent bg-tag-blue-bg px-2.5 py-0.5 text-[13px] font-semibold text-tag-blue-text">
                            {post.category.name}
                        </Badge>

                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            Reported {formatDate(post.createdAt)}
                        </span>

                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            Updated {formatDate(post.updatedAt)}
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            {post.location.address}
                        </span>

                        <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4 shrink-0" />
                            Reported by{" "}
                            {post.isAnonymous
                                ? "Anonymous"
                                : (post.author?.name ?? "Unknown")}
                        </span>
                    </div>

                    <Separator className="bg-border-custom" />

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            onClick={handleLike}
                            variant={hasLiked ? "default" : "outline"}
                            className={cn(
                                "h-auto rounded-xl px-4 py-2.5 text-xs font-bold",
                                !hasLiked &&
                                "bg-section border-border-custom hover:border-primary/50",
                            )}
                        >
                            <ThumbsUp
                                className={cn(
                                    "w-4 h-4",
                                    hasLiked && "fill-current",
                                )}
                            />
                            {likes} Support
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto rounded-xl border-border-custom bg-section px-4 py-2.5 text-xs font-bold hover:border-primary/50"
                        >
                            <a href="#comments" className="flex gap-3">
                                <MessageSquare className="w-4 h-4" />
                                {post.counts.comments} Comments
                            </a>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleShare}
                            className="h-auto rounded-xl border-border-custom bg-section px-4 py-2.5 text-xs font-bold hover:border-primary/50"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>

                        <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-auto">
                            <Eye className="w-4 h-4" />
                            {post.counts.views} views
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className={CARD_CLASS}>
                <CardContent className="space-y-3 p-5 sm:p-6">
                    <h2 className="text-base font-bold text-foreground">
                        Issue details
                    </h2>

                    <div className="space-y-3">
                        {paragraphs.map((paragraph, index) => (
                            <p
                                key={index}
                                className="text-sm text-foreground/90 leading-relaxed"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {post.timeline.length > 0 && (
                <Card className={CARD_CLASS}>
                    <CardContent className="space-y-5 p-5 sm:p-6">
                        <h2 className="text-base font-bold text-foreground">
                            Status timeline
                        </h2>

                        <ol className="space-y-5">
                            {post.timeline.map((entry, index) => {
                                const isLast =
                                    index === post.timeline.length - 1;

                                return (
                                    <li
                                        key={entry.id}
                                        className="flex gap-4"
                                    >
                                        <div className="flex flex-col items-center">
                                            <span
                                                className={cn(
                                                    "w-8 h-8 shrink-0 rounded-full flex items-center justify-center border",
                                                    STATUS_STYLES[
                                                    entry.toStatus
                                                    ],
                                                )}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </span>

                                            {!isLast && (
                                                <span className="w-px flex-1 bg-border-custom mt-1" />
                                            )}
                                        </div>

                                        <div className="pb-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-bold text-foreground">
                                                    {entry.title ??
                                                        STATUS_LABEL[
                                                        entry.toStatus
                                                        ]}
                                                </h3>
                                            </div>

                                            {entry.note && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {entry.note}
                                                </p>
                                            )}

                                            <p className="text-[11px] font-semibold text-muted-foreground">
                                                {formatDate(entry.createdAt)}
                                                {entry.actor
                                                    ? ` · ${entry.actor.name}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
