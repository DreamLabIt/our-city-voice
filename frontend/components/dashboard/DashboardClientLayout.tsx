"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { DashboardClientLayoutProps } from "@/types";

export default function DashboardClientLayout({
    children,
    user,
    isAdmin = false,
}: DashboardClientLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar
                isAdmin={isAdmin}
                user={user}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <Header
                    isAdmin={isAdmin}
                    user={user}
                />

                <main className="w-full flex-1 space-y-6 overflow-y-auto p-4 pl-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

