"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    Hash,
    Home,
    MapPin,
    MessageSquare,
    Navigation,
    Pause,
    Play,
    Plus,
    Send,
    Share2,
    Tag,
    ThumbsUp,
    User,
    Video,
} from "lucide-react";

import type { PostComment, PostItem, PriorityLevel, ReportStatus } from "@/types";

interface IssueDetailsProps {
    post: PostItem;
    comments: PostComment[];
    relatedPosts: PostItem[];
}

interface MediaItem {
    type: "video" | "image";
    src: string;
    poster?: string;
}

const statusStyles: Record<ReportStatus, string> = {
    Pending: "bg-tag-blue-bg text-tag-blue-text border-tag-blue-text/25",
    "In Progress": "bg-tag-amber-bg text-tag-amber-text border-tag-amber-text/25",
    Resolved: "bg-tag-green-bg text-tag-green-text border-tag-green-text/25",
    Rejected: "bg-red-50 text-red-700 border-red-200",
};

const priorityStyles: Record<PriorityLevel, string> = {
    Low: "bg-section text-muted-foreground border-border-custom",
    Medium: "bg-tag-blue-bg text-tag-blue-text border-tag-blue-text/25",
    High: "bg-tag-amber-bg text-tag-amber-text border-tag-amber-text/25",
    Critical: "bg-red-50 text-red-700 border-red-200",
};

function countComments(items: PostComment[]): number {
    return items.reduce((total, item) => total + 1 + (item.replies?.length ?? 0), 0);
}

export default function IssueDetails({
    post,
    comments,
    relatedPosts,
}: IssueDetailsProps): React.ReactNode {
    const mediaItems: MediaItem[] = useMemo(() => {
        const items: MediaItem[] = [];

        if (post.isVideo && post.video) {
            items.push({ type: "video", src: post.video, poster: post.image });
        }

        post.gallery.forEach((src) => {
            if (!items.some((item) => item.src === src)) items.push({ type: "image", src });
        });

        if (!items.some((item) => item.src === post.image)) {
            items.push({ type: "image", src: post.image });
        }

        return items;
    }, [post]);

    const [activeMedia, setActiveMedia] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [likes, setLikes] = useState<number>(post.likes);
    const [hasLiked, setHasLiked] = useState<boolean>(false);

    const [commentList, setCommentList] = useState<PostComment[]>(comments);
    const [likedComments, setLikedComments] = useState<string[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyBody, setReplyBody] = useState<string>("");

    const current = mediaItems[activeMedia];
    const totalComments = countComments(commentList);

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

    const handleSelectMedia = (index: number) => {
        if (index === activeMedia) return;

        videoRef.current?.pause();
        setIsPlaying(false);
        setActiveMedia(index);
    };

    const handleLike = () => {
        if (hasLiked) {
            setLikes((prev) => prev - 1);
            setHasLiked(false);
            toast.info("Support removed");
        } else {
            setLikes((prev) => prev + 1);
            setHasLiked(true);
            toast.success("Thanks for supporting this report!", {
                description: "Issues with more community support get prioritized sooner.",
            });
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied", { description: "Share it with your neighbours." });
        } catch {
            toast.error("Could not copy the link", { description: "Copy it from the address bar instead." });
        }
    };

    const handleCommentLike = (commentId: string) => {
        const isLiked = likedComments.includes(commentId);

        setLikedComments((prev) =>
            isLiked ? prev.filter((id) => id !== commentId) : [...prev, commentId]
        );

        const applyDelta = (items: PostComment[]): PostComment[] =>
            items.map((item) => ({
                ...item,
                likes: item.id === commentId ? item.likes + (isLiked ? -1 : 1) : item.likes,
                replies: item.replies ? applyDelta(item.replies) : item.replies,
            }));

        setCommentList((prev) => applyDelta(prev));
    };

    const handleAddComment = (event: React.FormEvent) => {
        event.preventDefault();

        const body = newComment.trim();
        if (!body) {
            toast.error("Write something before posting");
            return;
        }

        const comment: PostComment = {
            id: `local-${Date.now()}`,
            postId: post.id,
            author: "You",
            initials: "YO",
            role: "Resident",
            time: "Just now",
            body,
            likes: 0,
        };

        setCommentList((prev) => [comment, ...prev]);
        setNewComment("");
        toast.success("Comment posted", { description: "Your comment is now visible on this issue." });
    };

    const handleAddReply = (parentId: string) => {
        const body = replyBody.trim();
        if (!body) {
            toast.error("Write something before replying");
            return;
        }

        const reply: PostComment = {
            id: `local-${parentId}-${Date.now()}`,
            postId: post.id,
            author: "You",
            initials: "YO",
            role: "Resident",
            time: "Just now",
            body,
            likes: 0,
        };

        setCommentList((prev) =>
            prev.map((item) =>
                item.id === parentId ? { ...item, replies: [...(item.replies ?? []), reply] } : item
            )
        );

        setReplyBody("");
        setReplyingTo(null);
        toast.success("Reply posted");
    };

    const renderComment = (comment: PostComment, isReply = false) => (
        <div
            key={comment.id}
            className={`space-y-3 ${isReply ? "pl-4 sm:pl-5 border-l-2 border-border-custom" : ""}`}
        >
            <div className="flex gap-3">
                <div
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                        comment.isOfficial
                            ? "bg-primary text-white"
                            : "bg-tag-blue-bg text-tag-blue-text"
                    }`}
                >
                    {comment.initials}
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-foreground">{comment.author}</span>
                        {comment.isOfficial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                <BadgeCheck className="w-3 h-3" /> Official
                            </span>
                        )}
                        <span className="text-[11px] font-semibold text-muted-foreground">
                            {comment.role}
                        </span>
                        <span className="text-[11px] text-muted-foreground">· {comment.time}</span>
                    </div>

                    <p className="text-sm text-foreground/90 leading-relaxed">{comment.body}</p>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => handleCommentLike(comment.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                                likedComments.includes(comment.id)
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <ThumbsUp
                                className={`w-3.5 h-3.5 ${
                                    likedComments.includes(comment.id) ? "fill-current" : ""
                                }`}
                            />
                            <span>{comment.likes}</span>
                        </button>

                        {!isReply && (
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                    setReplyBody("");
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                                {replyingTo === comment.id ? "Cancel" : "Reply"}
                            </button>
                        )}
                    </div>

                    {replyingTo === comment.id && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <input
                                type="text"
                                value={replyBody}
                                onChange={(event) => setReplyBody(event.target.value)}
                                placeholder={`Reply to ${comment.author}...`}
                                className="flex-1 bg-section border border-border-custom rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddReply(comment.id)}
                                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Send className="w-3.5 h-3.5" /> Reply
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4 ml-5 sm:ml-7">
                    {comment.replies.map((reply) => renderComment(reply, true))}
                </div>
            )}
        </div>
    );

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            {/* Breadcrumb bar */}
            <div className="w-full bg-section border-b border-border-custom">
                <div className="max-w-458 mx-auto px-4 sm:px-8 md:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
                    <nav aria-label="Breadcrumb">
                        <ol className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground">
                            <li>
                                <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <Home className="w-4 h-4" /> Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight className="w-4 h-4 shrink-0" />
                                <span>Issues</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight className="w-4 h-4 shrink-0" />
                                <span className="text-primary font-bold">{post.code}</span>
                            </li>
                        </ol>
                    </nav>

                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to recent posts
                    </Link>
                </div>
            </div>

            <div className="max-w-458 mx-auto px-4 sm:px-8 md:px-10 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ── Main column ───────────────────────────────── */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Media */}
                        <div className="bg-card border border-border-custom rounded-2xl overflow-hidden shadow-xs">
                            <div className="relative w-full h-56 sm:h-80 md:h-100 bg-muted group/media">
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
                                                className="absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity cursor-pointer"
                                            >
                                                <span className="w-14 h-14 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg">
                                                    {isPlaying ? (
                                                        <Pause className="w-6 h-6 fill-current" />
                                                    ) : (
                                                        <Play className="w-6 h-6 fill-current ml-0.5" />
                                                    )}
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

                                <span
                                    className={`absolute top-3 left-3 z-10 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border backdrop-blur-md ${
                                        statusStyles[post.status]
                                    }`}
                                >
                                    {post.status}
                                </span>

                                <span
                                    className={`absolute top-3 right-3 z-10 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border backdrop-blur-md flex items-center gap-1 ${
                                        priorityStyles[post.priority]
                                    }`}
                                >
                                    <AlertTriangle className="w-3 h-3" /> {post.priority} priority
                                </span>
                            </div>

                            {mediaItems.length > 1 && (
                                <div className="flex gap-2.5 p-3 overflow-x-auto no-scrollbar">
                                    {mediaItems.map((item, index) => (
                                        <button
                                            key={`${item.src}-${index}`}
                                            type="button"
                                            onClick={() => handleSelectMedia(index)}
                                            aria-label={`Show ${item.type} ${index + 1} of ${mediaItems.length}`}
                                            className={`relative w-20 h-16 sm:w-24 sm:h-18 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                                index === activeMedia
                                                    ? "border-primary"
                                                    : "border-transparent hover:border-border-custom opacity-80 hover:opacity-100"
                                            }`}
                                        >
                                            <Image
                                                src={item.type === "video" ? (item.poster ?? post.image) : item.src}
                                                alt=""
                                                fill
                                                sizes="96px"
                                                className="object-cover"
                                            />
                                            {item.type === "video" && (
                                                <span className="absolute inset-0 bg-black/35 flex items-center justify-center text-white">
                                                    <Video className="w-4 h-4 fill-current" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title + engagement */}
                        <div className="bg-card border border-border-custom rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="font-mono font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-md text-xs">
                                    {post.code}
                                </span>
                                <span
                                    className={`text-[13px] px-2.5 py-0.5 rounded-md font-semibold ${post.tagBg} ${post.tagText}`}
                                >
                                    {post.tag}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" /> Reported {post.date}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" /> Updated {post.updatedAt}
                                </span>
                            </div>

                            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-primary shrink-0" /> {post.location}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <User className="w-4 h-4 shrink-0" /> Reported by {post.reportedBy}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border-custom">
                                <button
                                    type="button"
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                        hasLiked
                                            ? "bg-primary text-white border-primary"
                                            : "bg-section text-foreground border-border-custom hover:border-primary/50"
                                    }`}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`} />
                                    <span>{likes} Support</span>
                                </button>

                                <a
                                    href="#comments"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-custom bg-section text-foreground text-xs font-bold hover:border-primary/50 transition-all"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{totalComments} Comments</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-custom bg-section text-foreground text-xs font-bold hover:border-primary/50 transition-all cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4" /> Share
                                </button>

                                <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-auto">
                                    <Eye className="w-4 h-4" /> {post.views} views
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-card border border-border-custom rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
                            <h2 className="text-base font-bold text-foreground">Issue details</h2>
                            <div className="space-y-3">
                                {post.details.map((paragraph, index) => (
                                    <p key={index} className="text-sm text-foreground/90 leading-relaxed">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Status timeline */}
                        <div className="bg-card border border-border-custom rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                            <h2 className="text-base font-bold text-foreground">Status timeline</h2>

                            <ol className="space-y-5">
                                {post.updates.map((update, index) => {
                                    const isLast = index === post.updates.length - 1;

                                    return (
                                        <li key={update.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <span
                                                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border ${
                                                        statusStyles[update.status]
                                                    }`}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </span>
                                                {!isLast && <span className="w-px flex-1 bg-border-custom mt-1" />}
                                            </div>

                                            <div className="pb-1 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold text-foreground">{update.title}</h3>
                                                    <span
                                                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                                            statusStyles[update.status]
                                                        }`}
                                                    >
                                                        {update.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {update.note}
                                                </p>
                                                <p className="text-[11px] font-semibold text-muted-foreground">
                                                    {update.date} · {update.actor}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        {/* Comments */}
                        <div
                            id="comments"
                            className="bg-card border border-border-custom rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs scroll-mt-24"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-foreground">
                                    Comments <span className="text-muted-foreground">({totalComments})</span>
                                </h2>
                            </div>

                            <form onSubmit={handleAddComment} className="space-y-3">
                                <textarea
                                    value={newComment}
                                    onChange={(event) => setNewComment(event.target.value)}
                                    rows={3}
                                    placeholder="Add what you have seen at this location, or any update you know about..."
                                    className="w-full bg-section border border-border-custom rounded-xl p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                                />
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] text-muted-foreground">
                                        Comments are public and visible to municipal staff following this issue.
                                    </p>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer shadow-sm"
                                    >
                                        <Send className="w-4 h-4" /> Post comment
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-6 pt-2 border-t border-border-custom">
                                {commentList.length > 0 ? (
                                    commentList.map((comment) => (
                                        <div key={comment.id} className="pt-5 first:pt-4">
                                            {renderComment(comment)}
                                        </div>
                                    ))
                                ) : (
                                    <p className="pt-5 text-sm text-muted-foreground">
                                        No comments yet. Be the first to add what you know about this issue.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ───────────────────────────────────── */}
                    <aside className="lg:col-span-4 space-y-4">
                        <div className="bg-section border border-border-custom rounded-2xl p-5 space-y-3.5 shadow-xs">
                            <h2 className="text-base font-bold text-foreground">Issue summary</h2>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center justify-between gap-3 bg-card border border-border-custom rounded-xl px-3.5 py-2.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                        <Hash className="w-3.5 h-3.5 text-primary" /> Tracking ID
                                    </span>
                                    <span className="font-mono font-bold text-foreground">{post.code}</span>
                                </div>

                                <div className="flex items-center justify-between gap-3 bg-card border border-border-custom rounded-xl px-3.5 py-2.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Status
                                    </span>
                                    <span
                                        className={`font-extrabold px-2 py-0.5 rounded-md border ${
                                            statusStyles[post.status]
                                        }`}
                                    >
                                        {post.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 bg-card border border-border-custom rounded-xl px-3.5 py-2.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                        <AlertTriangle className="w-3.5 h-3.5 text-primary" /> Priority
                                    </span>
                                    <span
                                        className={`font-extrabold px-2 py-0.5 rounded-md border ${
                                            priorityStyles[post.priority]
                                        }`}
                                    >
                                        {post.priority}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 bg-card border border-border-custom rounded-xl px-3.5 py-2.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                        <Tag className="w-3.5 h-3.5 text-primary" /> Category
                                    </span>
                                    <span className="font-bold text-foreground text-right">{post.tag}</span>
                                </div>

                                <div className="flex items-center justify-between gap-3 bg-card border border-border-custom rounded-xl px-3.5 py-2.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                        <Building2 className="w-3.5 h-3.5 text-primary" /> Department
                                    </span>
                                    <span className="font-bold text-foreground text-right">{post.department}</span>
                                </div>

                                <div className="flex items-center justify-between gap-3 bg-card border border-border-custom rounded-xl px-3.5 py-2.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                        <User className="w-3.5 h-3.5 text-primary" /> Officer
                                    </span>
                                    <span className="font-bold text-foreground text-right">
                                        {post.assignedOfficer ?? "Unassigned"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-section border border-border-custom rounded-2xl p-5 space-y-3 shadow-xs">
                            <h2 className="text-base font-bold text-foreground">Location</h2>

                            <div className="space-y-2 text-xs">
                                <p className="flex items-start gap-2 text-foreground font-semibold">
                                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{post.address}</span>
                                </p>
                                <p className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Navigation className="w-4 h-4 shrink-0" /> {post.postalCode}
                                </p>
                                <p className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Building2 className="w-4 h-4 shrink-0" /> {post.ward}
                                </p>
                            </div>

                            <Link
                                href="/issues"
                                className="w-full bg-card hover:bg-background border border-border-custom text-foreground rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2 transition-colors"
                            >
                                <MapPin className="w-4 h-4 text-primary" /> View on issues map
                            </Link>

                            <Link
                                href="/report-issue"
                                className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Report a similar issue
                            </Link>
                        </div>

                        {relatedPosts.length > 0 && (
                            <div className="bg-section border border-border-custom rounded-2xl p-5 space-y-3 shadow-xs">
                                <h2 className="text-base font-bold text-foreground">Related issues</h2>

                                <div className="space-y-2.5">
                                    {relatedPosts.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/issues/${related.id}`}
                                            className="flex gap-3 bg-card border border-border-custom rounded-xl p-2.5 hover:border-primary/50 transition-colors group"
                                        >
                                            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                                                <Image
                                                    src={related.image}
                                                    alt={related.title}
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                />
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <p className="text-[11px] font-bold text-primary">{related.code}</p>
                                                <h3 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                                    {related.title}
                                                </h3>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {related.location}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </section>
    );
}
