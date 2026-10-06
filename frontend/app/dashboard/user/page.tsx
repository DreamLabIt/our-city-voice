import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UserDashboardPage() {
    return (
        <DashboardLayout isAdmin={false}>
            <div className="space-y-4">
                <h1 className="text-2xl font-black tracking-tight">Citizen Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Track your reported issues, municipal updates, and community endorsements.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    <div className="p-5 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
                        <span className="text-xs text-muted-foreground">My Total Reports</span>
                        <p className="text-2xl font-extrabold text-foreground">5</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}