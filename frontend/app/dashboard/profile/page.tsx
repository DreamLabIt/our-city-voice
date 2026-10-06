import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UserDashboardPage() {
    return (
        <DashboardLayout isAdmin={false}>
            <div className="space-y-4">
                <h1 className="text-2xl font-black tracking-tight">Welcome</h1>
            </div>
        </DashboardLayout>
    );
}