import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function AdminDashboardPage() {
    return (
        <DashboardLayout isAdmin={true}>
            <div className="space-y-4">
                <h1 className="text-2xl font-black tracking-tight">Welcome</h1>
            </div>
        </DashboardLayout>
    );
}