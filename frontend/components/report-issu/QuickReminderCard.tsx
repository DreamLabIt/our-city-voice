import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function QuickReminderCard() {
    return (
        <Card className="bg-section border border-border-custom rounded-2xl p-5 space-y-2 shadow-none">
            <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span>Quick Reminder</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Please provide accurate and complete information when submitting a report. This helps our team understand the issue clearly.
                </p>

                <p className="text-xs text-muted-foreground leading-relaxed">
                    Avoid submitting fake or duplicate reports. Accurate descriptions help field teams prioritize genuine public hazards faster.
                </p>
            </CardContent>
        </Card>
    );
}