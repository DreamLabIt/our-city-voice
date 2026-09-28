"use client";

import React from "react";
import {
    Filter,
    LayoutGrid,
    Building2,
    Map,
    Road,
    MapPin,
    Home,
    ChevronDown,
} from "lucide-react";

export default function FilterPostsCard(): React.JSX.Element {
    return (
        <div className="bg-[#f8fafc]/80 rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2 text-[#0f172a] font-bold text-base">
                    <Filter className="w-5 h-5 text-[#1d63ed] fill-[#1d63ed]" />
                    <span>Filter Posts</span>
                </div>
                <button
                    type="button"
                    className="text-md font-semibold text-[#1d63ed] hover:underline cursor-pointer pr-2"
                >
                    Reset
                </button>
            </div>

            <div className="space-y-2">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                        <LayoutGrid className="w-4 h-4" />
                    </div>
                    <select className="w-full pl-12 pr-8 py-2.5 bg-white border border-slate-200/90 rounded text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1d63ed] appearance-none cursor-pointer shadow-2xs">
                        <option value="">Select Category</option>
                        <option value="roads">Roads</option>
                        <option value="water">Water & Sewer</option>
                        <option value="flooding">Stormwater & Flooding</option>
                        <option value="sidewalks">Sidewalks</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <select className="w-full pl-12 pr-8 py-2.5 bg-white border border-slate-200/90 rounded text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1d63ed] appearance-none cursor-pointer shadow-2xs">
                        <option value="">Select City / Municipality</option>
                        <option value="toronto">Toronto</option>
                        <option value="scarborough">Scarborough</option>
                        <option value="north-york">North York</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                        <Map className="w-4 h-4" />
                    </div>
                    <select className="w-full pl-12 pr-8 py-2.5 bg-white border border-slate-200/90 rounded text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1d63ed] appearance-none cursor-pointer shadow-2xs">
                        <option value="">Select Ward</option>
                        <option value="1">Ward 1</option>
                        <option value="2">Ward 2</option>
                        <option value="3">Ward 3</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                        <Road className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Road / Street Name"
                        className="w-full pl-12 pr-3 py-2.5 bg-white border border-slate-200/90 rounded text-xs font-medium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d63ed] shadow-2xs"
                    />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Postal Code"
                        className="w-full pl-12 pr-3 py-2.5 bg-white border border-slate-200/90 rounded text-xs font-medium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d63ed] shadow-2xs"
                    />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                        <Home className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Address / Property"
                        className="w-full pl-12 pr-3 py-2.5 bg-white border border-slate-200/90 rounded text-xs font-medium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d63ed] shadow-2xs"
                    />
                </div>

                <button
                    type="button"
                    className="w-full bg-[#1d63ed] hover:bg-[#1553cb] active:scale-[0.99] text-white font-semibold py-2.5 rounded-sm text-xs transition-all cursor-pointer shadow-sm mt-1"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
}