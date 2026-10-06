"use client";

import { useTransition } from "react";
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

/**
 * The signed-in half of the navbar: an avatar that opens a small menu.
 *
 * Replaces the Login button rather than sitting next to it, so the header never
 * offers to sign in somebody who already is.
 */

/** First letters of the first two words. "Ada Lovelace" becomes AL. */
function initialsOf(name: string): string {
    const letters = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

    // A name made entirely of punctuation would otherwise render an empty
    // circle, which reads as a broken image rather than as a person.
    return letters || "?";
}

export default function UserMenu({ user }: { user: AuthUser }) {
    const [isPending, startTransition] = useTransition();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Account menu for ${user.name}`}
                className="flex items-center gap-1.5 rounded-xl p-1 pr-2 transition-colors hover:bg-section focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <Avatar size="lg">
                    {/* A plain img under the hood, not next/image. The optimiser
                        would add a round trip through our server for an image
                        Cloudinary already serves at the right size. */}
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {initialsOf(user.name)}
                    </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <div className="px-1.5 py-1">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>

                <DropdownMenuSeparator />

                {/* Disabled on purpose: there is no /dashboard route yet, and an
                    item that looks clickable and goes nowhere reads as a bug.
                    When the route lands, drop `disabled` and add
                    render={<Link href="/dashboard" />}. */}
                <DropdownMenuItem disabled>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    disabled={isPending}
                    // closeOnClick is left on: the action redirects, so the menu
                    // is unmounted with the page either way.
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
