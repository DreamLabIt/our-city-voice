"use client";

import Link from "next/link";
import { User, Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems } from "@/data/mock-data";
import type { NavbarProps, NavItem } from "@/types";
import SearchDialog from "../Dialog/SearchDialog";
import SectionContainer from "./SectionContainer";
import UserMenu from "./UserMenu";

export default function Navbar({ user, Reports = [] }: NavbarProps): React.ReactNode {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();

    return (
        <header className="w-full bg-card relative">
            <SectionContainer>
                <div className="w-full flex h-20 items-center justify-between border-b border-border-custom">

                    <Link
                        href="/"
                        className="flex items-center gap-3 group shrink-0"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <div className="relative flex items-center justify-center -ml-3">
                            <Image
                                src="/logo.png"
                                alt="OurCityVoice Logo"
                                width={180}
                                height={45}
                                className="h-10 sm:h-12 w-auto object-contain"
                                priority
                            />
                        </div>

                        <div className="flex flex-col justify-center">
                            <div className="text-xl sm:text-3xl font-extrabold tracking-tight leading-none flex items-center">
                                <span className="text-foreground">OurCity</span>
                                <span className="text-primary">Voice</span>
                            </div>
                            <p className="text-[11px] sm:text-[14px] font-semibold text-muted-foreground tracking-wide mt-1">
                                Report &nbsp;&nbsp;·&nbsp;&nbsp;Share&nbsp;&nbsp;·&nbsp;&nbsp;Improve&nbsp;&nbsp;·&nbsp;&nbsp;Together
                            </p>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                        {navItems.map((item: NavItem) => {
                            const isActive: boolean = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-foreground/70 hover:text-white hover:bg-primary"
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <SearchDialog Reports={Reports} />

                        {user ? (
                            <UserMenu user={user} />
                        ) : (
                            <Link
                                href="/login"
                                className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 md:px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
                            >
                                <User className="w-4 h-4 stroke-[2.5]" />
                                <span>Login</span>
                            </Link>
                        )}

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle Navigation Menu"
                            className="lg:hidden p-2 text-foreground/80 hover:text-primary hover:bg-section rounded-xl transition focus:outline-none"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-8 h-8 stroke-[2.5]" />
                            ) : (
                                <Menu className="w-8 h-8 stroke-[2.5]" />
                            )}
                        </button>
                    </div>

                </div>

                {isMobileMenuOpen && (
                    <div className="lg:hidden absolute top-20 right-2 md:right-10 max-w-xs md:max-w-sm w-full bg-card border border-border-custom p-4 space-y-3 shadow-2xl rounded-b-2xl z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                        <nav className="flex flex-col space-y-1.5">
                            {navItems.map((item: NavItem) => {
                                const isActive: boolean = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 ${isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-foreground/80 hover:bg-tag-blue-bg hover:text-primary"
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {!user && (
                            <div className="pt-2 sm:hidden border-t border-border-custom">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-3 rounded-xl text-base transition shadow-sm"
                                >
                                    <User className="w-5 h-5 stroke-[2.5]" />
                                    <span>Login</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

            </SectionContainer>
        </header>
    );
}