import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import Overview from "@/components/dashboard/(layout)/Overview";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "super_admin";

    return (
        <DashboardLayout user={user!} isAdmin={isAdmin}>
            <Overview user={user!} isAdmin={isAdmin} />
        </DashboardLayout>
    );
}