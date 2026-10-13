import {
    ClipboardList,
    LayoutDashboard,
    Settings,
} from "lucide-react";
import type { NavItem } from "@/types";

export const adminNavItems: NavItem[] = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Issues", href: "/dashboard/issues", icon: ClipboardList },
    { name: "Profile", href: "/dashboard/profile", icon: Settings },
];

export const userNavItems: NavItem[] = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Issues", href: "/dashboard/issues", icon: ClipboardList },
    { name: "Profile", href: "/dashboard/profile", icon: Settings },
];