"use client";

import Link from "next/link";
import { Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavItem {
    name: string;
    href: string;
}

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { name: "Home", href: "/" },
        { name: "Issues Map", href: "/issues" },
        { name: "Reports", href: "/reports" },
        { name: "Statistics", href: "/statistics" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <header className="w-full bg-white relative">
            <div className="max-w-[1940px] mx-auto w-full flex h-20 items-center justify-between px-4 sm:px-8 md:px-10 border-b border-gray-100">

                <Link
                    href="/"
                    className="flex items-center gap-3 group shrink-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div className="relative flex items-center justify-center">
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
                            <span className="text-[#102a56]">OurCity</span>
                            <span className="text-[#1d63ed]">Voice</span>
                        </div>
                        <p className="text-[11px] sm:text-[14px] font-semibold text-gray-400 tracking-wide mt-1">
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
                                    ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20"
                                    : "text-gray-600 hover:text-white hover:bg-[#2563eb]"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        aria-label="Search"
                        className="p-2 text-gray-700 hover:text-[#2563eb] hover:bg-gray-100 rounded-full transition"
                    >
                        <Search className="w-6 h-6 stroke-[2.2]" />
                    </button>

                    <Link
                        href="/login"
                        className="hidden sm:flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-medium px-4 md:px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
                    >
                        <User className="w-4 h-4 stroke-[2.5]" />
                        <span>Login</span>
                    </Link>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Navigation Menu"
                        className="lg:hidden p-2 text-gray-700 hover:text-[#2563eb] hover:bg-gray-100 rounded-xl transition focus:outline-none"
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
                <div className="lg:hidden absolute top-20 right-2 md:right-10 max-w-xs md:max-w-sm w-full bg-white border border-gray-100 p-4 space-y-3 shadow-2xl rounded-b-2xl z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                    <nav className="flex flex-col space-y-1.5">
                        {navItems.map((item: NavItem) => {
                            const isActive: boolean = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 ${isActive
                                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20"
                                        : "text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]"
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-2 sm:hidden border-t border-gray-100">
                        <Link
                            href="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full bg-[#2563eb] hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl text-base transition shadow-sm"
                        >
                            <User className="w-5 h-5 stroke-[2.5]" />
                            <span>Login</span>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}