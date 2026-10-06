"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageIcon, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adminNavItems, userNavItems } from "@/config/dashboard-nav";
import type { SidebarProps, NavItem } from "@/types";
import Image from "next/image";

export default function Sidebar({ isAdmin, user, isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const navItems: NavItem[] = isAdmin ? adminNavItems : userNavItems;

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 relative z-30 h-screen top-0",
                isCollapsed ? "w-18" : "w-56",
            )}
        >
            <div className="h-19 flex items-center justify-start px-4 border-b border-border">
                <Link href="/" className="flex items-start gap-2 overflow-hidden">
                    <div className="relative flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="OurCityVoice Logo"
                            width={180}
                            height={45}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col truncate gap-1">
                            <span className="font-extrabold text-md text-foreground tracking-tight leading-tight">
                                OurCity<span className="text-primary">Voice</span>
                            </span>
                            <span className="text-[12px] text-muted-foreground font-medium flex items-center">
                                {isAdmin ? (
                                    <>
                                        <ShieldCheck className="w-3 h-3 text-primary" /> Admin
                                        Portal
                                    </>
                                ) : (
                                    <>
                                        <User className="w-4 h-4 text-muted-foreground" /> Citizen
                                        Portal
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon ? item.icon : PackageIcon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                            )}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <Icon
                                className={cn(
                                    "w-5 h-5 shrink-0",
                                    isActive
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground group-hover:text-foreground",
                                )}
                            />

                            {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}

                            {!isCollapsed && item.badge && (
                                <span
                                    className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold rounded-full",
                                        isActive
                                            ? "bg-primary-foreground text-primary"
                                            : "bg-destructive/10 text-destructive",
                                    )}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-border">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl text-xs"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span>Collapse Menu</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
