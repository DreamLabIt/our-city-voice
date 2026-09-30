"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description?: string;
    bgImage?: string;
    customBreadcrumbName?: string;
}

export default function PageHeader({
    title,
    description,
    bgImage = "/hero-bg.png",
    customBreadcrumbName,
}: PageHeaderProps): React.JSX.Element {
    const pathname = usePathname();

    const pathSegments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <section className="relative w-full min-h-80 lg:min-h-100 items-center justify-center overflow-hidden flex flex-col text-white">

            <div className="absolute inset-0 z-0">
                <Image
                    src={bgImage}
                    alt={title}
                    fill
                    priority
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-r from-slate-800/40 via-slate-800/50 to-slate-800/40" />
            </div>

            <div className="max-w-[1940px] w-full mx-auto px-4 sm:px-8 md:px-10 py-10 text-center space-y-3 z-10">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight capitalize text-white drop-shadow-md">
                    {title}
                </h1>
                {description && (
                    <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        {description}
                    </p>
                )}

                <nav aria-label="Breadcrumb" className="overflow-x-auto no-scrollbar flex justify-center">
                    <ol className="flex items-center gap-1.5 sm:gap-2 text-md sm:text-xl font-medium text-white whitespace-nowrap">

                        <li>
                            <Link
                                href="/"
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                <span>Home</span>
                            </Link>
                        </li>

                        {pathSegments.map((segment, index) => {
                            const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                            const isLast = index === pathSegments.length - 1;

                            const formattedName = customBreadcrumbName && isLast
                                ? customBreadcrumbName
                                : segment.replace(/-/g, " ");

                            return (
                                <li key={href} className="flex items-center gap-1.5 sm:gap-2">
                                    <ChevronRight className="w-5 h-5 text-white shrink-0" />
                                    {isLast ? (
                                        <span className="text-primary font-semibold capitalize">
                                            {formattedName}
                                        </span>
                                    ) : (
                                        <Link
                                            href={href}
                                            className="hover:text-primary transition-colors capitalize"
                                        >
                                            {formattedName}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}

                    </ol>
                </nav>

            </div>

        </section>
    );
}