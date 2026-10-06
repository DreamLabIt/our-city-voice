"use client";

import React, { useState } from "react";
import AppSidebar from "./Sidebar";
import TopHeader from "./Header";

interface DashboardLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

export default function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <AppSidebar
                isAdmin={isAdmin}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <TopHeader isAdmin={isAdmin} />

                <main className="flex-1 p-4 pl-6 w-full mx-auto space-y-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}