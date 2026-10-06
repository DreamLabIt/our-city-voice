import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import DashboardClientLayout from "./DashboardClientLayout";
import type { DashboardLayoutProps } from "@/types";

export default async function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "super_admin";

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

