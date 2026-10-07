"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { DashboardLayoutProps } from "@/types";

export default function Overview({
    user,
    isAdmin = false,
}: DashboardLayoutProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const role = user?.role;
    const isSuperAdmin = isAdmin || role === "super_admin";

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {

            } catch (error) {
                console.error("Error fetching overview data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [isSuperAdmin, user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-75">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight">
                    {isSuperAdmin ? "Admin Overview" : "Citizen Dashboard"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    {isSuperAdmin
                        ? "Real-time summary of city issues, user stats, and resolution tracking."
                        : `Welcome back, ${user?.name || "User"}! Track your reported issues and community cases.`}
                </p>
            </div>


        </div>
    );
}