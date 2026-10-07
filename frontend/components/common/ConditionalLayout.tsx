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
    user: AuthUser | null;
}) {
    const pathname = usePathname();

    const isChromeless =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname.startsWith("/dashboard");

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