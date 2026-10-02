import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CallToActionSection() {
    return (
        <section className="bg-linear-to-r from-primary/4 via-primary/8 to-transparent border border-primary/10 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow">
            <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center justify-center md:justify-start gap-2">
                    <span>Ready to Make Your Neighborhood Better?</span>
                </h3>
                <p className="text-sm text-muted-foreground max-w-120">
                    Join thousands of residents already reporting issues and transforming city infrastructure today.
                </p>
            </div>

            <Button className="px-8 py-6 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-colors shrink-0 shadow-md inline-flex items-center gap-2">
                <Link href="/report-issue" className="inline-flex items-center gap-2 justify-between">
                    <span>Report an Issue Now</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </Button>
        </section>
    );
}