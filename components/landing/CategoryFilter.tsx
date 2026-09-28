"use client";

import { useState } from "react";
import {
    LayoutGrid,
    Road,
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
    LucideIcon,
} from "lucide-react";

export interface CategoryItem {
    id: string;
    label: string;
    icon: LucideIcon;
    iconColor?: string;
    isOther?: boolean;
}

const categories: CategoryItem[] = [
    { id: "all", label: "All", icon: LayoutGrid, iconColor: "text-[#1d63ed]" },
    { id: "roads", label: "Roads", icon: Road, iconColor: "text-[#0f172a]" },
    { id: "water", label: "Water & Sewer", icon: Droplets, iconColor: "text-[#1d63ed]" },
    { id: "stormwater", label: "Stormwater & Flooding", icon: CloudRain, iconColor: "text-[#1d63ed]" },
    { id: "parks", label: "Parks & Recreation", icon: Trees, iconColor: "text-[#16a34a]" },
    { id: "waste", label: "Waste & Recycling", icon: Trash2, iconColor: "text-[#16a34a]" },
    { id: "streetlights", label: "Streetlights & Signals", icon: Lightbulb, iconColor: "text-[#0f172a]" },
    { id: "buildings", label: "Buildings & Facilities", icon: Building2, iconColor: "text-[#0f172a]" },
    { id: "transit", label: "Transit & Mobility", icon: Bus, iconColor: "text-[#1d63ed]" },
    { id: "environment", label: "Environment", icon: TreePine, iconColor: "text-[#16a34a]" },
    { id: "community", label: "Community & Safety", icon: Users, iconColor: "text-[#1d63ed]" },
    { id: "other", label: "Other", icon: MoreHorizontal, isOther: true },
];

export default function CategoryFilter() {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    return (
        <section className="w-full bg-white py-4">
            <div className="max-w-[1940px] mx-auto px-8 md:px-10">

                <div className="w-full overflow-x-auto  pt-1 no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-4 sm:gap-6 w-max pr-4 sm:pr-6">
                        {categories.map((cat: CategoryItem) => {
                            const isSelected: boolean = selectedCategory === cat.id;
                            const Icon: LucideIcon = cat.icon;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    type="button"
                                    className={`group relative flex flex-col items-center justify-between w-27.5 h-25 sm:w-30 sm:h-27.5 p-3 rounded-2xl transition-all duration-200 select-none cursor-pointer border ${isSelected
                                        ? "bg-[#edf4ff] border-2 border-[#22a56c] shadow-sm"
                                        : "bg-[#f8fafc] border-slate-200/70 hover:bg-slate-100/80 hover:border-[#22a56c]"
                                        }`}
                                >
                                    <div className="flex-1 flex items-center justify-center">
                                        {cat.isOther ? (
                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isSelected
                                                    ? "bg-[#1d63ed] text-white"
                                                    : "bg-slate-200/80 text-slate-700 group-hover:bg-slate-300/80"
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5 stroke-[2.5]" />
                                            </div>
                                        ) : (
                                            <Icon
                                                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors stroke-2 ${isSelected
                                                    ? "text-[#1d63ed]"
                                                    : cat.iconColor || "text-slate-700"
                                                    }`}
                                            />
                                        )}
                                    </div>

                                    <span
                                        className={`text-[11px] sm:text-[12px] font-semibold text-center leading-tight transition-colors line-clamp-2 px-0.5 ${isSelected ? "text-[#1d63ed]" : "text-slate-700"
                                            }`}
                                    >
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}