"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/Footer";

export default function ConditionalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Routes that bring their own chrome. The auth pages are full-bleed splits
    // with their own branding, and the dashboard has its own header with the
    // signed-in account in it; showing the public navbar on top of either gives
    // two headers, and on the dashboard a "Login" button to somebody who is
    // already signed in.
    //
    // A prefix match for the dashboard, so pages added underneath it are covered
    // without anybody having to remember this file exists.
    const isChromeless =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/");

    if (isChromeless) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
}