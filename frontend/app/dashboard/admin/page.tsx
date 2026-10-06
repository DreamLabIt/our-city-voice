import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function AdminDashboardPage() {
    return (
        <DashboardLayout>
            <div className="space-y-4">
                <h1 className="text-2xl text-center font-black tracking-tight">Welcome Super Admin</h1>
            </div>
        </DashboardLayout>
    );
}