"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionContainer from "../common/SectionContainer";
import type { ExploreTopLocationsProps } from "@/types/report";

export default function ExploreTopLocations({
    recentPosts = [],
}: ExploreTopLocationsProps): React.ReactNode {
    const wardCounts = recentPosts.reduce<
        Record<
            string,
            {
                count: number;
                sample: (typeof recentPosts)[number];
                wardName: string;
                wardCode: string;
            }
        >
    >((acc, post) => {
        const rawWard = post.ward;

        if (!rawWard) return acc;

        const wardName =
            typeof rawWard === "object"
                ? rawWard.name || rawWard.code || ""
                : rawWard;

        const wardCode =
            typeof rawWard === "object"
                ? rawWard.code || rawWard.id || rawWard.name || ""
                : rawWard;

        const key = wardCode || wardName;

        if (!key) return acc;

        if (!acc[key]) {
            acc[key] = {
                count: 0,
                sample: post,
                wardName,
                wardCode,
            };
        }
        acc[key].count += 1;
        return acc;
    }, {});

    const topWards = Object.entries(wardCounts)
        .map(([, data]) => ({
            ward: data.wardName,
            wardCode: data.wardCode,
            reportsCount: data.count,
            samplePost: data.sample,
        }))
        .sort((a, b) => b.reportsCount - a.reportsCount)
        .slice(0, 4);

    return (
        <section className="relative w-full my-8 py-12 sm:py-16 md:py-20 text-white">
            <div className="absolute inset-x-0 top-0 h-80 bg-primary/90 z-0" />

            <SectionContainer>
                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8 md:mb-12">
                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                                Explore Top Locations
                            </h2>

                            <p className="text-sm sm:text-base text-white/80 font-normal max-w-lg">
                                Browse reported issues and community updates from top wards with highest activity.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            className="bg-white hover:bg-white/90 text-foreground font-semibold px-5 py-2.5 sm:px-6 sm:py-3 h-auto rounded border-none transition-all duration-200 group shrink-0 cursor-pointer"
                        >
                            <Link href="/issues-map" className="flex items-center gap-2">
                                <span>See All Locations</span>
                                <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 text-foreground" />
                            </Link>
                        </Button>
                    </div>

                    {topWards.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                            {topWards.map((item) => {
                                const samplePost = item.samplePost as any;
                                const sampleImage =
                                    samplePost?.media?.image ||
                                    (Array.isArray(samplePost?.images) && samplePost.images.length > 0
                                        ? typeof samplePost.images[0] === "string"
                                            ? samplePost.images[0]
                                            : samplePost.images[0]?.url
                                        : samplePost?.image || "/placeholder.jpg");

                                const locationName =
                                    typeof samplePost.location === "object"
                                        ? samplePost.location?.address || samplePost.location?.name
                                        : samplePost.location || item.ward;

                                const queryCode = item.wardCode || item.ward;

                                return (
                                    <Link
                                        key={queryCode}
                                        href={`/reports?ward=${encodeURIComponent(queryCode)}`}
                                        className="group block h-full"
                                    >
                                        <Card className="relative h-68 sm:h-76 md:h-86 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-muted">
                                            <Image
                                                src={sampleImage}
                                                alt={item.ward}
                                                fill
                                                unoptimized
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                                priority
                                            />

                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 group-hover:from-black/90" />

                                            <CardContent className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end z-10 text-white">
                                                <div className="flex items-end justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-1">
                                                            {item.ward}
                                                        </h3>

                                                        <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-1">
                                                            {locationName}
                                                        </p>

                                                        <p className="text-xs font-semibold text-white/90 pt-1">
                                                            {item.reportsCount}{" "}
                                                            {item.reportsCount === 1 ? "Report" : "Reports"} Posted
                                                        </p>
                                                    </div>

                                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-foreground flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                                                        <ArrowUpRight className="w-5 h-5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-45" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-white/10 rounded-2xl border border-white/20 text-white/80">
                            No locations available right now.
                        </div>
                    )}
                </div>
            </SectionContainer>
        </section>
    );
}