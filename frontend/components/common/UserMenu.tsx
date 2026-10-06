"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, Loader2, LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/types";

function initialsOf(name: string): string {
    const letters = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

    return letters || "?";
}

export default function UserMenu({ user }: { user: AuthUser }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Account menu for ${user.name}`}
                className="flex items-center gap-1.5 rounded-xl p-1 pr-2 transition-colors hover:bg-section focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <Avatar size="lg">
                    {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt="" />
                    )}

                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {initialsOf(user.name)}
                    </AvatarFallback>
                </Avatar>

                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <div className="px-1.5 py-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {user.name}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() =>
                        router.push(
                            user.role === "super_admin"
                                ? "/dashboard/admin"
                                : "/dashboard/user"
                        )
                    }
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => startTransition(() => logoutAction())}
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="h-4 w-4" />
                    )}

                    {isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}