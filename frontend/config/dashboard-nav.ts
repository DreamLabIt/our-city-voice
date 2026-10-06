import {
    LayoutDashboard,
    AlertCircle,
    CheckCircle2,
    Users,
    Settings,
    FileText,
    BarChart3,
    UserCheck,
} from "lucide-react";
import type { NavItem } from "@/types";

export const adminNavItems: NavItem[] = [
    { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Manage Reports", href: "/dashboard/admin/reports", icon: AlertCircle, badge: "12" },
    { name: "Departments", href: "/dashboard/admin/departments", icon: BarChart3 },
    { name: "User Management", href: "/dashboard/admin/users", icon: Users },
    { name: "Verification", href: "/dashboard/admin/verifications", icon: UserCheck },
    { name: "System Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export const userNavItems: NavItem[] = [
    { name: "My Dashboard", href: "/dashboard/user", icon: LayoutDashboard },
    { name: "My Reported Issues", href: "/dashboard/user/my-reports", icon: AlertCircle },
    { name: "Resolved Issues", href: "/dashboard/user/resolved", icon: CheckCircle2 },
    { name: "Activity Logs", href: "/dashboard/user/activity", icon: FileText },
    { name: "Account Settings", href: "/dashboard/user/settings", icon: Settings },
];