import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight max-w-180">
                    Bridging the Gap Between <span className="text-primary">Citizens</span> & <span className="text-primary">City Authorities</span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    OurCityVoice is a community-driven civic management system designed to make city infrastructure reporting seamless, transparent, and actionable. From pothole repairs to street light outage fixes, we empower residents to report issues and track resolutions in real time.
                </p>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    By fostering collaboration between active citizens and municipality teams, we are building cleaner, safer, and more resilient urban environments for everyone.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                    <Button className="px-6 py-6 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm">
                        <Link href="/reports" className="inline-flex items-center gap-2 justify-between ">
                            <FileText className="w-4 h-4" />
                            <span>Explore Recent Reports</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant="outline" className="px-6 py-6 bg-section hover:bg-card border border-border-custom text-foreground font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2 justify-between">
                        <Link href="/contact" className="inline-flex items-center gap-2 justify-between ">
                            <HeartHandshake className="w-4 h-4 text-primary" />
                            <span>Contact Our Team</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="lg:col-span-6 relative">
                <div className="relative w-full h-80 sm:h-105 rounded-2xl overflow-hidden border border-border-custom shadow-xl">
                    <Image
                        src="/isue.jpeg"
                        alt="Community Infrastructure Project"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="absolute bottom-4 left-6 right-6 bg-card/60 p-5 rounded-xl shadow-lg flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Impact Created</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-foreground">12,500+ Issues Resolved</p>
                        </div>
                        <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}