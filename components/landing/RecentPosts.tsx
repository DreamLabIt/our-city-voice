"use client";

import React, { useState } from "react";

export default function RecentPosts(): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<string>("Latest");

    const tabs: string[] = ["Latest", "Most Commented", "Nearby", "Map View"];

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs ">
            <div className="flex items-start justify-start border-b border-slate-200/60  gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
                <h2 className="text-base font-bold text-[#0f172a]">
                    Recent Posts
                </h2>
                <div className="flex items-center gap-6 overflow-x-auto ">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`text-md font-semibold relative pb-2.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab
                                ? "text-[#1d63ed]"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1d63ed] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>


        </div>
    );
}