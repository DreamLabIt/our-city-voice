import DashboardClientLayout from "./DashboardClientLayout";
import type { DashboardLayoutProps } from "@/types";

export default async function DashboardLayout({
    children,
    user,
    isAdmin = false,
}: DashboardLayoutProps) {

    if (!user) {
        return null;
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