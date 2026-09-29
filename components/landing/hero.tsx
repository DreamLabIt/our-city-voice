"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Video, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function HeroSection(): React.JSX.Element {
    const [searchQuery, setSearchQuery] = useState<string>("");

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Searching for:", searchQuery);
    };

    return (
        <section className="relative w-full min-h-80 lg:min-h-100 flex items-center justify-center overflow-hidden">

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

            <div className="relative z-10 max-w-[1940px] w-full mx-auto px-4 sm:px-8 md:px-10 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                    <div className="lg:col-span-6 space-y-5 text-white">

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                            Your City. Your Voice.
                        </h1>

                        <p className="text-base sm:text-lg lg:text-xl text-gray-100 font-normal max-w-2xl leading-relaxed drop-shadow-sm">
                            Report infrastructure and community issues, share photos or videos, and help build a better, safer and stronger city for everyone.
                        </p>

                        <div className="pt-2">
                            <Link
                                href="/submit-issue"
                                className="inline-flex items-center gap-3.5 bg-tag-green-text hover:opacity-90 text-white font-semibold px-6 py-3 sm:px-7 sm:py-3.5 rounded-2xl border-2 border-white/90 shadow-md transition-all duration-200 group"
                            >
                                <Video className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white stroke-[1.5]" />

                                <span className="text-base sm:text-lg font-medium tracking-wide text-white">
                                    Submit an Issue
                                </span>

                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5] ml-1 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-6">
                        <div className="bg-card/80 backdrop-blur-[20%] p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-1">

                            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                                Find Issues
                            </h2>

                            <form onSubmit={handleSearch} className="flex items-center gap-3">
                                <div className="relative flex-1 flex items-center">
                                    <Search className="absolute left-3.5 sm:left-4 w-5 h-5 text-muted pointer-events-none stroke-2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                        placeholder="Search by ID number, address, road, ward or keyword..."
                                        className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border-custom bg-card text-foreground placeholder:text-muted text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg shrink-0"
                                >
                                    Search
                                </button>
                            </form>

                            <p className="text-xs sm:text-[13px] text-muted font-medium">
                                Example: #1024, Finch Ave, Ward 5, M1B 3J4
                            </p>

                        </div>
                    </div>

                </div>
            </div>

        </section>
    );
}