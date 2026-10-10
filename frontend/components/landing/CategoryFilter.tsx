"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    type LucideIcon,
    LayoutGrid,
    Road,
    Footprints,
    Droplets,
    CloudRain,
    Trees,
    Trash2,
    Lightbulb,
    Building2,
    Bus,
    TreePine,
    Users,
    MoreHorizontal,
    Wrench,
} from "lucide-react";

import { categories } from "@/data/mock-data";
import SectionContainer from "../common/SectionContainer";
import type { CategoryItem, CategoryFilterProps } from "@/types"

const getFallbackIcon = (nameOrId: string): LucideIcon => {
    const key = nameOrId.toLowerCase();

    if (key.includes("all")) return LayoutGrid;
    if (key.includes("road")) return Road;
    if (key.includes("sidewalk")) return Footprints;
    if (key.includes("water") || key.includes("sewer")) return Droplets;
    if (key.includes("storm") || key.includes("flood")) return CloudRain;
    if (key.includes("park")) return Trees;

    if (
        key.includes("waste") ||
        key.includes("garbage") ||
        key.includes("trash")
    ) {
        return Trash2;
    }

    if (key.includes("street") || key.includes("light")) return Lightbulb;
    if (key.includes("building")) return Building2;
    if (key.includes("transit") || key.includes("bus")) return Bus;
    if (key.includes("environment")) return TreePine;
    if (key.includes("community") || key.includes("safety")) return Users;
    if (key.includes("other")) return MoreHorizontal;

    return Wrench;
};

export default function CategoryFilter({
    allCategory,
    onSelectCategory,
}: CategoryFilterProps): React.ReactNode {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get("category") || "all";
    const [selectedCategory, setSelectedCategory] =
        useState<string>(currentCategory);

    const categoryList: CategoryItem[] =
        allCategory && allCategory.length > 0
            ? allCategory
            : categories;

    const otherCategory = categoryList.find((category) => category.isOther);
    const mainCategories = categoryList.filter(
        (category) => !category.isOther,
    );

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);

        const params = new URLSearchParams(searchParams.toString());

        if (categoryId === "all") {
            params.delete("category");
        } else {
            params.set("category", categoryId);
        }

        const queryString = params.toString();

        router.push(
            queryString
                ? `/reports?${queryString}`
                : "/reports",
        );

        onSelectCategory?.(categoryId);
    };

    const getCategoryButtonClass = (isSelected: boolean) =>
        `shrink-0 group relative flex flex-col items-center justify-between
        w-24 sm:w-27.5 h-24 sm:h-25 md:w-30 md:h-27.5
        p-2.5 sm:p-3 rounded-2xl transition-all duration-200
        select-none cursor-pointer border ${isSelected
            ? "bg-tag-blue-bg border-2 border-tag-green-text shadow-sm"
            : "bg-section border-border-custom hover:bg-slate-100/80 hover:border-tag-green-text"
        }`;

    return (
        <section className="mt-4 py-4">
            <SectionContainer>
                <div className="w-full bg-card">
                    <div className="flex items-center justify-between gap-3 overflow-x-auto px-1 py-2 text-left scrollbar-none sm:gap-4">
                        {mainCategories.map((category) => {
                            const isSelected =
                                selectedCategory === category.id;

                            const Icon =
                                category.icon ||
                                getFallbackIcon(
                                    category.label || category.id,
                                );

                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() =>
                                        handleCategoryClick(category.id)
                                    }
                                    className={getCategoryButtonClass(
                                        isSelected,
                                    )}
                                >
                                    <div className="flex flex-1 items-center justify-center">
                                        <Icon
                                            className={`h-6 w-6 stroke-2 transition-colors sm:h-7 sm:w-7 md:h-8 md:w-8 ${isSelected
                                                ? "text-primary"
                                                : category.iconColor ||
                                                "text-foreground/80"
                                                }`}
                                        />
                                    </div>

                                    <span
                                        className={`line-clamp-2 px-0.5 text-center text-[10px] font-semibold leading-tight transition-colors sm:text-[11px] md:text-[12px] ${isSelected
                                            ? "text-primary"
                                            : "text-foreground/80"
                                            }`}
                                    >
                                        {category.label}
                                    </span>
                                </button>
                            );
                        })}

                        {otherCategory &&
                            (() => {
                                const isSelected =
                                    selectedCategory === otherCategory.id;

                                const Icon =
                                    otherCategory.icon ||
                                    getFallbackIcon(
                                        otherCategory.label ||
                                        otherCategory.id,
                                    );

                                return (
                                    <button
                                        key={otherCategory.id}
                                        type="button"
                                        onClick={() =>
                                            handleCategoryClick(
                                                otherCategory.id,
                                            )
                                        }
                                        className={getCategoryButtonClass(
                                            isSelected,
                                        )}
                                    >
                                        <div className="flex flex-1 items-center justify-center">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9 ${isSelected
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-200/80 text-foreground/80 group-hover:bg-slate-300/80"
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4 stroke-[2.5] sm:h-5 sm:w-5" />
                                            </div>
                                        </div>

                                        <span
                                            className={`line-clamp-2 px-0.5 text-center text-[10px] font-semibold leading-tight transition-colors sm:text-[11px] md:text-[12px] ${isSelected
                                                ? "text-primary"
                                                : "text-foreground/80"
                                                }`}
                                        >
                                            {otherCategory.label}
                                        </span>
                                    </button>
                                );
                            })()}
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}