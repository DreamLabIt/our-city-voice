"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";

/**
 * A button, not a link.
 *
 * Signing out changes state on the server, so it has to be a POST. A GET link
 * would let any page on the internet sign somebody out by embedding an image
 * pointing at it.
 */
export default function LogoutButton() {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => logoutAction())}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border-custom bg-card text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-60"
        >
            {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Sign out</span>
        </button>
    );
}
