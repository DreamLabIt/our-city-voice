import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import Overview from "@/components/dashboard/(layout)/Overview";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAdminOverview, getMyStats } from "../actions/statistics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login?next=/dashboard");
    }

    const isAdmin = user.role === "super_admin";

    let adminOverviewData = null;
    let myStatsData = null;

    if (isAdmin) {
        const res = await getAdminOverview().catch(() => ({ success: false, data: undefined }));
        adminOverviewData = res.success ? res.data : null;
    } else {
        const res = await getMyStats().catch(() => ({ success: false, stats: undefined }));
        myStatsData = res.success ? res.stats : null;
    }

    return (
        <DashboardLayout user={user} isAdmin={isAdmin}>
            <Overview
                user={user}
                isAdmin={isAdmin}
                adminOverview={adminOverviewData}
                myStats={myStatsData}
            />
        </DashboardLayout>
    );
}

