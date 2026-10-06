import React from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import DashboardClientLayout from "./DashboardClientLayout";

interface DashboardLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

export default async function DashboardLayout({
    children,
    isAdmin = false,
}: DashboardLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <DashboardClientLayout
            user={user}
            isAdmin={isAdmin}
        >
            {children}
        </DashboardClientLayout>
    );
}

