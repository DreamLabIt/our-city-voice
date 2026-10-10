import { PieChart, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MostReportedIssuesCardProps } from "@/types/report";

export default function MostReportedIssuesCard({ Reports = [] }: MostReportedIssuesCardProps) {
    const totalReports = Reports.length;
    const categoryCounts: Record<string, number> = {};
    const wardCounts: Record<string, number> = {};

    Reports.forEach((report) => {
        const catName =
            typeof report.category === "object"
                ? report.category?.name || "General"
                : report.category || "General";

        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;

        const wardName =
            typeof report.ward === "object"
                ? report.ward?.name || report.ward?.code || ""
                : report.ward || "";

        const locationName =
            typeof report.location === "object"
                ? report.location?.address || report.location?.city || ""
                : report.location || "";

        const areaKey = wardName || locationName;
        if (areaKey) {
            wardCounts[areaKey] = (wardCounts[areaKey] || 0) + 1;
        }
    });

    const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
        }));

    const topAreas = Object.entries(wardCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([area]) => area);

    return (
        <Card className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow-sm">
            <CardContent className="p-0 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border-custom pb-3 uppercase tracking-wide">
                    <PieChart className="w-4 h-4 text-primary" />
                    <span>Most Reported Issues</span>
                </h3>

                <div className="space-y-3">
                    {topCategories.length > 0 ? (
                        topCategories.map((cat, index) => {
                            const opacityClasses = ["bg-primary", "bg-primary/80", "bg-primary/60"];

                            return (
                                <div key={cat.name}>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-foreground">{cat.name}</span>
                                        <span className="text-primary">{cat.percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${opacityClasses[index] || "bg-primary/50"}`}
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No category data available.</p>
                    )}
                </div>

                <div className="pt-2 border-t border-border-custom/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>High Activity Areas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs justify-center">
                        {topAreas.length > 0 ? (
                            topAreas.map((area) => (
                                <span
                                    key={area}
                                    className="bg-section border border-border-custom text-muted-foreground px-2.5 py-1 rounded-md"
                                >
                                    {area}
                                </span>
                            ))
                        ) : (
                            <span className="bg-section border border-border-custom text-muted-foreground px-2.5 py-1 rounded-md">
                                Municipal Area
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}