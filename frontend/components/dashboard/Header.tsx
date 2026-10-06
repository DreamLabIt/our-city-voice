"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell,
    Menu,
    Sun,
    Moon,
    User,
    LogOut,
    Settings,
    ShieldCheck
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminNavItems, userNavItems } from "@/config/dashboard-nav";
import type { NavItem } from "@/types";

interface HeaderProps {
    isAdmin: boolean;
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
}

export default function Header({
    isAdmin,
    userName = "Shourav Hasan",
    userEmail = "shourav@example.com",
    userAvatar = ""
}: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const navItems: NavItem[] = isAdmin ? adminNavItems : userNavItems;

    return (
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
                <Sheet>
                    <SheetTrigger className="inline-flex items-center justify-center rounded-xl h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                        <Menu className="w-5 h-5" />
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <div className="p-4 border-b border-border flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-base">
                                O
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">OurCityVoice</span>
                                <span className="text-xs text-muted-foreground">{isAdmin ? "Admin Console" : "User Portal"}</span>
                            </div>
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
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </SheetContent>
                </Sheet>
                <span className="font-extrabold text-sm sm:text-base tracking-tight">OurCityVoice</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-foreground capitalize">{isAdmin ? "Admin Access" : "Citizen User"}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground relative"
                >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="relative h-9 rounded-full pl-2 pr-1 sm:pr-3 flex items-center gap-2 hover:bg-muted outline-none"
                    >
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={userAvatar} alt={userName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {userName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        <span className="hidden sm:inline-block text-xs font-bold text-foreground max-w-25 truncate">
                            {userName}
                        </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-xs font-bold text-foreground leading-none">
                                        {userName}
                                    </p>

                                    <p className="text-[11px] text-muted-foreground leading-none">
                                        {userEmail}
                                    </p>

                                    {isAdmin && (
                                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                                            <ShieldCheck className="w-3 h-3" />
                                            System Admin
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem>
                            <Link
                                href="/dashboard/profile"
                                className="cursor-pointer text-xs flex items-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                Profile Settings
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            <Link
                                href="/dashboard/settings"
                                className="cursor-pointer text-xs flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Account
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="text-destructive cursor-pointer text-xs flex items-center gap-2 font-semibold">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}