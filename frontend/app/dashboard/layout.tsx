import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import LogoutButton from "@/components/dashboard/LogoutButton";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
    title: "Dashboard | Our City Voice",
};

/**
 * The shell every signed-in page sits inside.
 *
 * It checks the session even though proxy.ts already did. Not redundancy for its
 * own sake: proxy.ts only runs on the paths in its matcher, and a new route added
 * outside that list would otherwise be wide open. The layout is attached to the
 * routes themselves, so it cannot be forgotten.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/dashboard");

    const initials = user.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border-custom bg-card">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <Link href="/" className="font-bold text-sm tracking-tight">
                        Our City Voice
                    </Link>

                    <div className="flex items-center gap-3">
                        {user.role === "super_admin" && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Super admin
                            </span>
                        )}

                        <div className="flex items-center gap-2 min-w-0">
                            {user.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full object-cover border border-border-custom"
                                />
                            ) : (
                                <span className="w-8 h-8 rounded-full bg-section text-muted-foreground text-[11px] font-semibold flex items-center justify-center">
                                    {initials}
                                </span>
                            )}
                            <span className="hidden sm:block text-xs font-semibold truncate max-w-40">
                                {user.name}
                            </span>
                        </div>

                        <LogoutButton />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        </div>
    );
}
