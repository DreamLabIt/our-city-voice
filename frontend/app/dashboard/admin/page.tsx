import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function AdminDashboardPage() {
    return (
        <DashboardLayout isAdmin={true}>
            <div className="space-y-4">
                <h1 className="text-2xl font-black tracking-tight">Admin Overview</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage civic issues, route reports to departments, and review active user permissions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <div className="p-5 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
                        <span className="text-xs text-muted-foreground">Pending Issues</span>
                        <p className="text-2xl font-extrabold text-destructive">24</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
                        <span className="text-xs text-muted-foreground">Resolved Issues</span>
                        <p className="text-2xl font-extrabold text-primary">148</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}