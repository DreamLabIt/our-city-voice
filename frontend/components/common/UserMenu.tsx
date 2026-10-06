"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronDown,
    LayoutDashboard,
    Loader2,
    LogOut,
    User,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
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
    const pathname = usePathname();

    const [isPending, startTransition] = useTransition();

    const isDashboard = pathname.startsWith("/dashboard");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Account menu for ${user.name}`}
                className="group flex items-center gap-1.5 rounded-xl p-1 pr-2 transition-colors hover:bg-section"
            >
                <Avatar size="lg">
                    {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt="" />
                    )}

                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {initialsOf(user.name)}
                    </AvatarFallback>
                </Avatar>

                <ChevronDown
                    className="hidden h-4 w-4 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180 sm:block"
                />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="mt-2.75 w-56"
            >
                <div className="px-1.5 py-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {user.name}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </p>
                </div>

                <DropdownMenuSeparator />

                {!isDashboard && (
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
                )}

                <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profile")}
                >
                    <User className="h-4 w-4" />
                    Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                        startTransition(() => logoutAction())
                    }
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

