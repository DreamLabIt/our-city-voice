"use client";

import { useState } from "react";
import { BadgeCheck, Send, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { IssueComment } from "@/types/IssueDetails";
import { CARD_CLASS, countComments, getInitials, timeAgo } from "@/lib/utils";
import type { CommentsProps, CommentItemProps } from "@/types/IssueDetails";

function CommentItem({ comment, isReply = false, onLike, onReply }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyBody, setReplyBody] = useState("");
    const name = comment.author?.name ?? "Anonymous";

    const submitReply = () => {
        const message = replyBody.trim();
        if (!message) {
            toast.error("Write something before replying");
            return;
        }
        onReply(comment.id, message);
        setReplyBody("");
        setIsReplying(false);
    };

    return (
        <div className={cn("space-y-3", isReply && "pl-4 sm:pl-5 border-l-2 border-border-custom")}>
            <div className="flex gap-3">
                <Avatar className="size-9 shrink-0">
                    {comment.author?.avatarUrl && (
                        <AvatarImage src={comment.author.avatarUrl} alt={name} />
                    )}
                    <AvatarFallback
                        className={cn(
                            "text-[11px] font-extrabold",
                            comment.isOfficial
                                ? "bg-primary text-white"
                                : "bg-tag-blue-bg text-tag-blue-text",
                        )}
                    >
                        {getInitials(name) || "?"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-foreground">{name}</span>
                        {comment.isOfficial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                <BadgeCheck className="w-3 h-3" /> Official
                            </span>
                        )}
                        {comment.author?.role && (
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                {comment.author.role}
                            </span>
                        )}
                        {comment.createdAt && (
                            <span className="text-[11px] text-muted-foreground">
                                · {timeAgo(comment.createdAt)}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-foreground/90 leading-relaxed">{comment.message}</p>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => onLike(comment.id)}
                            className={cn(
                                "flex items-center gap-1.5 transition-colors cursor-pointer",
                                comment.likedByMe
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <ThumbsUp className={cn("w-3.5 h-3.5", comment.likedByMe && "fill-current")} />
                            <span>{comment.likeCount}</span>
                        </button>

                        {!isReply && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsReplying((prev) => !prev);
                                    setReplyBody("");
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                                {isReplying ? "Cancel" : "Reply"}
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Input
                                value={replyBody}
                                onChange={(event) => setReplyBody(event.target.value)}
                                placeholder={`Reply to ${name}...`}
                                className="flex-1 rounded-xl border-border-custom bg-section text-xs"
                            />
                            <Button
                                type="button"
                                onClick={submitReply}
                                className="h-auto rounded-xl px-4 py-2 text-xs font-bold"
                            >
                                <Send className="w-3.5 h-3.5" /> Reply
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4 ml-5 sm:ml-7">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            isReply
                            onLike={onLike}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Comments({ postId, comments }: CommentsProps): React.ReactNode {
    const [list, setList] = useState<IssueComment[]>(comments);
    const [newComment, setNewComment] = useState("");

    const total = countComments(list);

    const buildLocal = (id: string, message: string): IssueComment => ({
        id,
        postId,
        message,
        likeCount: 0,
        likedByMe: false,
        createdAt: new Date().toISOString(),
        author: { id: "me", name: "You", role: "Resident" },
    });

    const handleAddComment = (event: React.FormEvent) => {
        event.preventDefault();

        const message = newComment.trim();
        if (!message) {
            toast.error("Write something before posting");
            return;
        }

        setList((prev) => [buildLocal(`local-${Date.now()}`, message), ...prev]);
        setNewComment("");
        toast.success("Comment posted", {
            description: "Your comment is now visible on this issue.",
        });
    };

    const handleAddReply = (parentId: string, message: string) => {
        const reply = buildLocal(`local-${parentId}-${Date.now()}`, message);
        setList((prev) =>
            prev.map((item) =>
                item.id === parentId ? { ...item, replies: [...(item.replies ?? []), reply] } : item,
            ),
        );
        toast.success("Reply posted");
    };

    const handleLike = (commentId: string) => {
        const apply = (items: IssueComment[]): IssueComment[] =>
            items.map((item) => {
                const replies = item.replies ? apply(item.replies) : item.replies;
                if (item.id !== commentId) return { ...item, replies };
                return {
                    ...item,
                    replies,
                    likedByMe: !item.likedByMe,
                    likeCount: item.likeCount + (item.likedByMe ? -1 : 1),
                };
            });
        setList((prev) => apply(prev));
    };

    return (
        <Card id="comments" className={cn(CARD_CLASS, "scroll-mt-24")}>
            <CardContent className="space-y-5 p-5 sm:p-6">
                <h2 className="text-base font-bold text-foreground">
                    Comments <span className="text-muted-foreground">({total})</span>
                </h2>

                <form onSubmit={handleAddComment} className="space-y-3">
                    <Textarea
                        value={newComment}
                        onChange={(event) => setNewComment(event.target.value)}
                        rows={3}
                        placeholder="Add what you have seen at this location, or any update you know about..."
                        className="resize-y rounded-xl border-border-custom bg-section p-3.5 text-sm"
                    />
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-muted-foreground">
                            Comments are public and visible to municipal staff following this issue.
                        </p>
                        <Button
                            type="submit"
                            className="h-auto shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm"
                        >
                            <Send className="w-4 h-4" /> Post comment
                        </Button>
                    </div>
                </form>

                <Separator className="bg-border-custom" />

                {list.length > 0 ? (
                    <div className="space-y-6">
                        {list.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onLike={handleLike}
                                onReply={handleAddReply}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No comments yet. Be the first to add what you know about this issue.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}