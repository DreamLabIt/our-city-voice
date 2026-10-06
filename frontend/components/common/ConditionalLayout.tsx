"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/Footer";
import type { AuthUser } from "@/types";

export default function ConditionalLayout({
    children,
    user,
}: {
    children: React.ReactNode;
    /** Passed straight to the navbar. See NavbarProps for why it comes from above. */
    user: AuthUser | null;
}) {
    const pathname = usePathname();

    // The auth pages are full-bleed splits with their own branding, so the
    // public navbar on top of one gives two headers.
    const isChromeless =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/dashboard/admin" ||
        pathname === "/dashboard/user";

    if (isChromeless) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar user={user} />

            <main className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
}