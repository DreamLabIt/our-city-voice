import { BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlatformInsightsCardProps } from "@/types/report";

export default function PlatformInsightsCard({ Reports = [] }: PlatformInsightsCardProps) {
    const totalReceived = Reports.length;
    const solvedCount = Reports.filter((report) => {
        const status = typeof report.status === "string" ? report.status.toLowerCase() : "";
        return status === "resolved" || status === "solved";
    }).length;

    const resolutionRate = totalReceived > 0 ? ((solvedCount / totalReceived) * 100).toFixed(1) : "0.0";

    return (
        <Card className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow">
            <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between border-b border-border-custom pb-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <span>Platform Insights</span>
                    </h3>
                    <span className="text-[12px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                        Live Updates
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-section border border-border-custom/80 p-3.5 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Received</span>
                        </div>
                        <p className="text-xl font-extrabold text-foreground">{totalReceived.toLocaleString()}</p>
                    </div>

                    <div className="bg-section border border-border-custom/80 p-3.5 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Solved</span>
                        </div>
                        <p className="text-xl font-extrabold text-foreground">{solvedCount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-section border border-border-custom/80 p-3.5 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Success Resolution Rate</p>
                        <p className="text-lg font-bold text-emerald-500">{resolutionRate}%</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs p-8">
                        {Math.round(Number(resolutionRate))}%
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}