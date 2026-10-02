import { PieChart, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MostReportedIssuesCard() {
    return (
        <Card className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow-sm">
            <CardContent className="p-0 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border-custom pb-3 uppercase tracking-wide">
                    <PieChart className="w-4 h-4 text-primary" />
                    <span>Most Reported Issues</span>
                </h3>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-foreground">Roads & Potholes</span>
                            <span className="text-primary">42%</span>
                        </div>
                        <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-[42%]" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-foreground">Street Lighting</span>
                            <span className="text-primary">28%</span>
                        </div>
                        <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                            <div className="h-full bg-primary/80 rounded-full w-[28%]" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-foreground">Waste & Garbage</span>
                            <span className="text-primary">18%</span>
                        </div>
                        <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full w-[18%]" />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-border-custom/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>High Activity Areas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                        <span className="bg-section border border-border-custom text-muted-foreground px-2.5 py-1 rounded-md">
                            Main Commercial Zone (Ward 3)
                        </span>
                        <span className="bg-section border border-border-custom text-muted-foreground px-2.5 py-1 rounded-md">
                            Station Road Crossing
                        </span>
                        <span className="bg-section border border-border-custom text-muted-foreground px-2.5 py-1 rounded-md">
                            Sector 4 Bypass
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}