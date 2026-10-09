import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { RelatedPostsProps } from "@/types/IssueDetails";
import { SIDE_CARD_CLASS } from "@/lib/utils";

export default function RelatedPosts({
    relatedPosts,
}: RelatedPostsProps): React.ReactNode {
    if (relatedPosts.length === 0) return null;

    return (
        <Card className={SIDE_CARD_CLASS}>
            <CardContent className="space-y-3 p-5">
                <h2 className="text-base font-bold text-foreground">
                    Related issues
                </h2>

                <div className="space-y-2.5">
                    {relatedPosts.map((related) => (
                        <Link
                            key={related.id}
                            href={`/issues/${related.trackingCode}`}
                            className="flex gap-3 bg-card border border-border-custom rounded-xl p-2.5 hover:border-primary/50 transition-colors group"
                        >
                            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                                {related.media.image !== null && (
                                    <Image
                                        src={related.media.image}
                                        alt={related.title}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                )}
                            </div>

                            <div className="min-w-0 space-y-1">
                                <p className="text-[11px] font-bold text-primary">
                                    {related.trackingCode}
                                </p>

                                <h3 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                    {related.title}
                                </h3>

                                <p className="text-[11px] text-muted-foreground truncate">
                                    {related.location.address}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
