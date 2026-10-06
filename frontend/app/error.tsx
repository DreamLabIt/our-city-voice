"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert, Bug, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import type { ErrorPageProps } from "@/types";


export default function ErrorPage({ error, reset }: ErrorPageProps): React.ReactNode {
    useEffect(() => {
        console.error("OurCityVoice Global Error:", error);
    }, [error]);
    const pathname = usePathname();
    return (
        <section className="min-h-[95vh] w-full bg-background text-foreground flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none -z-10" />

            <div className="max-w-lg w-full text-center space-y-6">
                <div className="relative inline-flex items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-destructive/10 border border-destructive/20 shadow-md flex items-center justify-center text-destructive animate-pulse">
                        <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 stroke-2" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Something Went Wrong!
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                        An unexpected error occurred while loading this page on <strong>OurCityVoice</strong>. Don't worry, your data and submitted reports are safe.
                    </p>
                </div>

                <Card className="border border-destructive/20 bg-destructive/5 text-left shadow-xs">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-destructive">
                            <div className="flex items-center gap-2">
                                <Bug className="w-4 h-4 shrink-0" />
                                <span>Error Details</span>
                            </div>

                            {pathname && (
                                <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-background/60 px-2 py-0.5 rounded border border-border/40">
                                    <FileCode className="w-3 h-3 text-destructive" />
                                    <span>{pathname}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-xs font-mono text-foreground/80 wrap-break-word line-clamp-3 bg-background/50 p-2.5 rounded-lg border border-border/50">
                            {error.message || "Unknown client-side exception encountered."}
                        </p>

                        {error.digest && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                                Digest Code: <span className="text-foreground font-semibold">{error.digest}</span>
                            </p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button
                        onClick={() => reset()}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 py-6 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto border-border hover:bg-muted font-semibold px-5 py-6 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                        <Link href="/" className="flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" />
                            <span>Back to Home</span>
                        </Link>
                    </Button>
                </div>

                <div className="pt-4 border-t border-border/60">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>If the problem persists, please refresh the browser or contact support.</span>
                    </p>
                </div>
            </div>
        </section>
    );
}