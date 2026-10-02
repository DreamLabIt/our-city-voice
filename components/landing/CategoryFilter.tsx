"use client";

import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { categories } from "@/data/mock-data";
import type { CategoryItem } from "@/types";

export default function CategoryFilter(): React.ReactNode {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const otherCategory = categories.find((c) => c.isOther);
    const mainCategories = categories.filter((c) => !c.isOther);

    return (
        <section className="w-full bg-card py-4">
            <div className="px-4 sm:px-8 md:px-10">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:flex lg:flex-wrap items-center gap-3 sm:gap-4 md:gap-6 justify-center sm:justify-between">
                    {mainCategories.map((cat: CategoryItem, index: number) => {
                        const isSelected: boolean = selectedCategory === cat.id;
                        const Icon: LucideIcon = cat.icon;
                        const isHiddenOnMobile = index >= 5;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                type="button"
                                className={`${
                                    isHiddenOnMobile ? "hidden sm:flex" : "flex"
                                } group relative flex-col items-center justify-between w-full sm:w-27.5 h-24 sm:h-25 md:w-30 md:h-27.5 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 select-none cursor-pointer border ${
                                    isSelected
                                        ? "bg-tag-blue-bg border-2 border-tag-green-text shadow-sm"
                                        : "bg-section border-border-custom hover:bg-slate-100/80 hover:border-tag-green-text"
                                }`}
                            >
                                <div className="flex-1 flex items-center justify-center">
                                    <Icon
                                        className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-colors stroke-2 ${
                                            isSelected
                                                ? "text-primary"
                                                : cat.iconColor || "text-foreground/80"
                                        }`}
                                    />
                                </div>

                                <span
                                    className={`text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-center leading-tight transition-colors line-clamp-2 px-0.5 ${
                                        isSelected ? "text-primary" : "text-foreground/80"
                                    }`}
                                >
                                    {cat.label}
                                </span>
                            </button>
                        );
                    })}

                    {otherCategory &&
                        (() => {
                            const isSelected: boolean = selectedCategory === otherCategory.id;
                            const Icon: LucideIcon = otherCategory.icon;

                            return (
                                <button
                                    key={otherCategory.id}
                                    onClick={() => setSelectedCategory(otherCategory.id)}
                                    type="button"
                                    className={`flex group relative flex-col items-center justify-between w-full sm:w-27.5 h-24 sm:h-25 md:w-30 md:h-27.5 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 select-none cursor-pointer border ${
                                        isSelected
                                            ? "bg-tag-blue-bg border-2 border-tag-green-text shadow-sm"
                                            : "bg-section border-border-custom hover:bg-slate-100/80 hover:border-tag-green-text"
                                    }`}
                                >
                                    <div className="flex-1 flex items-center justify-center">
                                        <div
                                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-200/80 text-foreground/80 group-hover:bg-slate-300/80"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                                        </div>
                                    </div>

                                    <span
                                        className={`text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-center leading-tight transition-colors line-clamp-2 px-0.5 ${
                                            isSelected ? "text-primary" : "text-foreground/80"
                                        }`}
                                    >
                                        {otherCategory.label}
                                    </span>
                                </button>
                            );
                        })()}
                </div>
            </div>
        </section>
    );
}
