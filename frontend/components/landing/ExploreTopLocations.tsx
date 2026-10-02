"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { topLocations } from "@/data/mock-data";
import SectionContainer from "../common/SectionContainer";

export default function ExploreTopLocations(): React.ReactNode {
    return (
        <section className="relative w-full my-8 py-12 sm:py-16 md:py-20 text-white">
            <div className="absolute inset-x-0 top-0 h-80 bg-primary/90 z-0" />

            <SectionContainer>

                <div className="relative z-10">
                    <div className=" flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8 md:mb-12">

                        <div className="space-y-2">

                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                                Explore Top Locations
                            </h2>

                            <p className="text-sm sm:text-base text-white/80 font-normal max-w-lg">
                                Browse reported issues and community updates from popular locations in one click.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            className="bg-white hover:bg-white/90 text-foreground font-semibold px-5 py-2.5 sm:px-6 sm:py-3 h-auto rounded border-none  transition-all duration-200 group shrink-0 cursor-pointer"
                        >
                            <Link href="/locations" className="flex items-center gap-2">
                                <span>See All Locations</span>

                                <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 text-foreground" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                        {topLocations.map((item) => (
                            <Link
                                key={item.id}
                                href={`/locations/${item.slug}`}
                                className="group block h-full"
                            >
                                <Card className="relative h-68 sm:h-76 md:h-86 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-transparent">

                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover w-full h-full "
                                        priority
                                    />

                                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/30 to-transparent transition-opacity duration-100 group-hover:from-black/60" />

                                    <CardContent className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end z-10 text-white">
                                        <div className="flex items-end justify-between gap-3">

                                            <div className="space-y-1">
                                                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                                    {item.name}
                                                </h3>

                                                <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-1">
                                                    {item.subTitle}
                                                </p>

                                                <p className="text-xs font-semibold text-white/90 pt-1">
                                                    {item.reportsCount}{" "}
                                                    {item.reportsCount === 1
                                                        ? "Report"
                                                        : "Reports"}{" "}
                                                    Posted
                                                </p>
                                            </div>

                                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-foreground flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                                                <ArrowUpRight className="w-5 h-5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-45" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

            </SectionContainer>
        </section>
    );
}