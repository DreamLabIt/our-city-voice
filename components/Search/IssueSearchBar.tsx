"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, Tag, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { SearchSuggestion } from "@/types";
import { mockSuggestions } from "@/data/mock-data";


interface IssueSearchBarProps {
    onSearch?: (query: string) => void;
}

export default function IssueSearchBar({ onSearch }: IssueSearchBarProps): React.JSX.Element {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return mockSuggestions.filter(
            (item) =>
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDropdownOpen(false);
        if (onSearch) {
            onSearch(searchQuery);
        }
    };

    const handleSelectSuggestion = (item: SearchSuggestion) => {
        setSearchQuery(`${item.id} - ${item.title}`);
        setIsDropdownOpen(false);
        if (onSearch) {
            onSearch(item.title);
        }
    };

    return (
        <div className="bg-card/80 backdrop-blur-[20%] p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Find Issues
            </h2>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 relative">
                <div ref={searchContainerRef} className="relative flex-1 flex items-center">
                    <Search className="absolute left-3.5 sm:left-4 w-5 h-5 text-muted-foreground pointer-events-none stroke-2 z-10" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => {
                            if (searchQuery.trim()) setIsDropdownOpen(true);
                        }}
                        placeholder="Search by ID number, address, road, ward or keyword..."
                        className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border-custom bg-card text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
                    />

                    {isDropdownOpen && searchQuery.trim().length > 0 && (
                        <div className="absolute top-12 left-0 right-0 mt-2 bg-card border border-border-custom rounded-2xl shadow-2xl overflow-hidden z-999 max-h-88  p-2 space-y-1">
                            {filteredSuggestions.length > 0 ? (
                                filteredSuggestions.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectSuggestion(item)}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-section transition cursor-pointer group"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {item.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3 text-primary" /> {item.category}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {item.location}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="secondary" className="capitalize text-[11px]">
                                                {item.type}
                                            </Badge>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No results found for "<span className="text-foreground font-medium">{searchQuery}</span>"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg shrink-0 cursor-pointer"
                >
                    Search
                </button>
            </form>

            <p className="text-xs sm:text-[13px] text-muted-foreground font-medium">
                Example: #1024, Finch Ave, Ward 5, M1B 3J4
            </p>
        </div>
    );
}