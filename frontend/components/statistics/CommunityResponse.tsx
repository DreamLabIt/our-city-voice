import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunityResponseProps } from "@/types/statistics";

export default function CommunityResponse({ stats }: CommunityResponseProps) {
    const items = [
        { label: "Upvotes", value: stats.upvotes },
        { label: "Comments", value: stats.comments },
        { label: "Views", value: stats.views },
    ];

    return (
        <Card className="bg-card border border-border-custom rounded-xl shadow-xs">
            <CardHeader className="px-5 sm:px-6 mb-2 space-y-1">
                <CardTitle className="text-xl font-semibold text-foreground">
                    Community response
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Totals across every report.
                </p>
            </CardHeader>

            <CardContent className="px-5 sm:px-6 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <Card
                            key={item.label}
                            className="bg-section/60 border border-border-custom/60 border-l-8 border-l-primary rounded-lg p-4 space-y-1 shadow-none"
                        >
                            <span className="text-xs text-muted-foreground font-medium block">
                                {item.label}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums block">
                                {item.value.toLocaleString()}
                            </span>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}