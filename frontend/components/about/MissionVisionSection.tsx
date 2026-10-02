import { Target, Eye, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MissionVisionSection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border border-border-custom p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-all border-l-6 border-l-primary/80">
                <CardContent className="p-0 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span>Our Mission</span>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        To provide an accessible, transparent, and technology-driven platform that empowers citizens to report local infrastructure issues and hold civic bodies accountable.
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-all border-l-6 border-l-primary/80">
                <CardContent className="p-0 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span>Our Vision</span>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        To become the leading digital ecosystem for smart cities, where citizen participation directly shapes modern, well-maintained, and sustainable urban infrastructure.
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-all border-l-6 border-l-primary/80">
                <CardContent className="p-0 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span>Our Values</span>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Transparency in progress, inclusivity in civic engagement, rapid response time, and trust between neighborhood communities and municipal teams.
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}