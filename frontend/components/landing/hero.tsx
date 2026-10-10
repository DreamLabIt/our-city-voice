import Image from "next/image";
import Link from "next/link";
import { Video, ChevronRight, ImageUp } from "lucide-react";
import IssueSearchBar from "../Search/IssueSearchBar";
import { Button } from "@/components/ui/button";
import SectionContainer from "../common/SectionContainer";
import type { HeroSectionProps } from "@/types";

export default function HeroSection({ AllPosts = [] }: HeroSectionProps): React.ReactNode {
    return (
        <section className="relative w-full min-h-80 lg:min-h-100 flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.jpg"
                    alt="City skyline background"
                    fill
                    priority
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-r from-slate-800/25 via-slate-800/27 to-slate-800/30" />
            </div>

            <SectionContainer>
                <div className="relative z-10 w-full py-12 lg:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        <div className="lg:col-span-6 space-y-5 text-white">
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                                Your City. Your Voice.
                            </h1>

                            <p className="text-base sm:text-lg lg:text-xl text-gray-100 font-normal max-w-2xl leading-relaxed drop-shadow-sm">
                                Report infrastructure and community issues, share photos or videos, and help build a better, safer and stronger city for everyone.
                            </p>

                            <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                                <Button
                                    nativeButton={false}
                                    render={
                                        <Link
                                            href={{
                                                pathname: "/report-issue",
                                                query: { type: "video" },
                                            }}
                                        />
                                    }
                                    className="group h-auto rounded-2xl border-2 border-white/90 bg-tag-green-text px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 sm:px-7 sm:py-3.5 cursor-pointer"
                                >
                                    <Video className="h-8! w-8! shrink-0 fill-white text-white" />

                                    <span className="text-base font-medium tracking-wide text-white sm:text-lg">
                                        Video an Issue
                                    </span>

                                    <ChevronRight className="ml-1 h-5 w-5 text-white stroke-[2.5] transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
                                </Button>

                                <Button
                                    nativeButton={false}
                                    render={
                                        <Link
                                            href={{
                                                pathname: "/report-issue",
                                                query: { type: "picture" },
                                            }}
                                        />
                                    }
                                    className="group h-auto rounded-2xl border-2 border-white/90 bg-tag-green-text px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 sm:px-7 sm:py-3.5 cursor-pointer"
                                >
                                    <ImageUp className="h-8! w-8! shrink-0 text-white" />
                                    <span className="text-base font-medium tracking-wide text-white sm:text-lg">
                                        Picture an Issue
                                    </span>

                                    <ChevronRight className="ml-1 h-5 w-5 text-white stroke-[2.5] transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
                                </Button>
                            </div>
                        </div>

                        <div className="lg:col-span-6">
                            <IssueSearchBar AllPosts={AllPosts} />
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}