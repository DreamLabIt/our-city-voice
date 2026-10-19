"use client";

import { useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL } from "./user-utils";
import { UserFiltersProps } from "@/types/user";

const ALL_ROLES = "All";
const SEARCH_MAX_LENGTH = 120;

export default function UserFilters({ search, role }: UserFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [searchValue, setSearchValue] = useState(search);
    const [roleValue, setRoleValue] = useState(role || ALL_ROLES);

    const appliedKey = `${search}|${role}`;
    const [previousKey, setPreviousKey] = useState(appliedKey);
    if (appliedKey !== previousKey) {
        setPreviousKey(appliedKey);
        setSearchValue(search);
        setRoleValue(role || ALL_ROLES);
    }

    const hasAppliedFilters = Boolean(search || role);

    const navigate = (nextSearch: string, nextRole: string): void => {
        const params = new URLSearchParams();
        const trimmedSearch = nextSearch.trim();

        if (trimmedSearch) params.set("search", trimmedSearch);
        if (nextRole !== ALL_ROLES) params.set("role", nextRole);

        const queryString = params.toString();

        startTransition(() => {
            router.push(queryString ? `${pathname}?${queryString}` : pathname);
        });
    };

    const handleSubmit = (event: FormEvent): void => {
        event.preventDefault();
        navigate(searchValue, roleValue);
    };

    const handleReset = (): void => {
        setSearchValue("");
        setRoleValue(ALL_ROLES);
        navigate("", ALL_ROLES);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center"
        >
            <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    type="text"
                    value={searchValue}
                    maxLength={SEARCH_MAX_LENGTH}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search by name or email..."
                    className="rounded-md border-border bg-background py-5 pl-10 pr-10 text-xs sm:text-sm"
                />

                {searchValue && (
                    <button
                        type="button"
                        onClick={() => setSearchValue("")}
                        aria-label="Clear search input"
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <Select
                value={roleValue}
                onValueChange={(value) => setRoleValue(value ?? ALL_ROLES)}
            >
                <SelectTrigger className="w-full rounded-md border-border bg-background py-5 text-xs font-semibold sm:w-44">
                    <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_ROLES}>All roles</SelectItem>
                    <SelectItem value="user">{ROLE_LABEL.user}</SelectItem>
                    <SelectItem value="super_admin">
                        {ROLE_LABEL.super_admin}
                    </SelectItem>
                </SelectContent>
            </Select>

            <div className="flex gap-2">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 gap-2 rounded-md px-6 py-5 text-xs font-bold sm:flex-none sm:text-sm"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                    <span>Search</span>
                </Button>

                {hasAppliedFilters && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={isPending}
                        className="rounded-md py-5 text-xs font-bold sm:text-sm"
                    >
                        Reset
                    </Button>
                )}
            </div>
        </form>
    );
}