import React from "react";
import Link from "next/link";
import { Home, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound(): React.ReactNode {
    return (
        <section className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none -z-10" />

            <div className="max-w-md w-full text-center space-y-6">
                <div className="relative inline-flex items-center justify-center">
                    <span className="text-8xl sm:text-9xl font-black tracking-tighter text-muted-foreground/20 select-none">
                        4 0 4
                    </span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Page Not Found
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                        The OurCityVoice report, ward, or page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button

                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 rounded-xl transition-all duration-200 cursor-pointer py-6"
                    >
                        <Link href="/" className="flex items-center justify-center gap-2 ">
                            <Home className="w-4 h-4" />
                            <span>Back to Home</span>
                        </Link>
                    </Button>

                    <Button

                        variant="outline"
                        className="w-full sm:w-auto border-border hover:bg-muted font-semibold px-5 rounded-xl transition-all duration-200 cursor-pointer py-6"
                    >
                        <Link href="/issues" className="flex items-center justify-center gap-2">
                            <Search className="w-4 h-4" />
                            <span>Browse Reports</span>
                        </Link>
                    </Button>
                </div>

                <div className="pt-6 border-t border-border/60">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Need help? Contact support or check active public reports.</span>
                    </p>
                </div>
            </div>
        </section>
    );
}