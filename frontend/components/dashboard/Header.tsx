"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu,
    User,
    ShieldCheck,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { adminNavItems, userNavItems } from "@/config/dashboard-nav";
import type { AuthUser, NavItem } from "@/types";
import Image from "next/image";
import UserMenu from "../common/UserMenu";

interface HeaderProps {
    isAdmin: boolean;
    user: AuthUser;
    name?: string;
    email?: string;
    userAvatar?: string;
}

export default function Header({
    isAdmin,
    user,
}: HeaderProps) {
    const pathname = usePathname();
    const navItems: NavItem[] = isAdmin ? adminNavItems : userNavItems;

    return (
        <header className="h-19 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
                <Sheet>
                    <SheetTrigger className="inline-flex items-center justify-center rounded-xl h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                        <Menu className="w-4 h-4" />
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <div className="h-18 flex items-center justify-start px-4 pt-2 border-b border-border">
                            <Link href="/" className="flex items-center gap-2 overflow-hidden">
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
                                <div className="flex flex-col truncate gap-">
                                    <span className="font-extrabold text-md text-foreground tracking-tight leading-tight">
                                        OurCity<span className="text-primary">Voice</span>
                                    </span>
                                    <span className="text-[12px] text-muted-foreground font-medium flex items-center">
                                        {isAdmin ? (
                                            <>
                                                <ShieldCheck className="w-3 h-3 text-primary " /> Admin Portal
                                            </>
                                        ) : (
                                            <>
                                                <User className="w-4 h-4 text-muted-foreground" /> Citizen Portal
                                            </>
                                        )}
                                    </span>
                                </div>
                            </Link>
                        </div>
                        <nav className="p-4 space-y-1.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </SheetContent>
                </Sheet>
                <span className="font-extrabold text-md text-foreground tracking-tight leading-tight">
                    OurCity<span className="text-primary">Voice</span>
                </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-foreground capitalize">{isAdmin ? "Admin Access" : "Citizen User"}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">

                <UserMenu user={user} />
            </div>
        </header>
    );
}