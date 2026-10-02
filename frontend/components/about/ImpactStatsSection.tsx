import { FileText, CheckCircle2, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ImpactStatsSection() {
    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">15,000+</p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Reports Submitted</p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">88%</p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resolution Success Rate</p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">48 Hours</p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Response Time</p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <Users className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">50,000+</p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Community Members</p>
                </CardContent>
            </Card>
        </section>
    );
}