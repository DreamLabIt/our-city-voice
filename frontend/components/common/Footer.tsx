"use client";

import React, { FormEvent } from "react";
import Link from "next/link";
import {
    MapPin,
    Mail,
    Phone,
    Send,
    Code2,
} from "lucide-react";
import Image from "next/image";
import SectionContainer from "./SectionContainer";

export default function Footer(): React.ReactNode {
    const handleSubscribe = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
    };

    return (
        <footer className="w-full bg-card border-t border-border-custom text-foreground pt-12 pb-6">

            <SectionContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

                    <div className="lg:col-span-2 space-y-4 mb-8">

                        <Link
                            href="/"
                            className="flex items-center gap-3 group shrink-0 -ml-3.5"
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
                                    <span className="text-foreground">OurCity</span>
                                    <span className="text-primary">Voice</span>
                                </div>
                                <p className="text-[11px] sm:text-[14px] font-semibold text-muted-foreground tracking-wide mt-1">
                                    Report &nbsp;&nbsp;·&nbsp;&nbsp;Share&nbsp;&nbsp;·&nbsp;&nbsp;Improve&nbsp;&nbsp;·&nbsp;&nbsp;Together
                                </p>
                            </div>
                        </Link>

                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                            Empowering communities to report, track, and resolve local infrastructure issues together. Make your neighborhood safer and better today.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <Link
                                href="#"
                                className="w-9 h-9 rounded-full bg-section hover:bg-primary hover:text-white text-foreground/80 flex items-center justify-center transition-colors border border-border-custom"
                                aria-label="Facebook"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </Link>
                            <Link
                                href="#"
                                className="w-9 h-9 rounded-full bg-section hover:bg-primary hover:text-white text-foreground/80 flex items-center justify-center transition-colors border border-border-custom"
                                aria-label="Twitter"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </Link>
                            <Link
                                href="#"
                                className="w-9 h-9 rounded-full bg-section hover:bg-primary hover:text-white text-foreground/80 flex items-center justify-center transition-colors border border-border-custom"
                                aria-label="Instagram"
                            >
                                <svg className="w-4 h-4 fill-none stroke-current stroke-2 stroke-round" viewBox="0 0 24 24">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </Link>
                            <Link
                                href="#"
                                className="w-9 h-9 rounded-full bg-section hover:bg-primary hover:text-white text-foreground/80 flex items-center justify-center transition-colors border border-border-custom"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-3 ">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                            Quick Links
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/" className="hover:text-primary transition-colors">
                                    All Categories
                                </Link>
                            </li>
                            <li>
                                <Link href="/reports" className="hover:text-primary  transition-colors">
                                    Recent Reports
                                </Link>
                            </li>
                            <li>
                                <Link href="/issues-map" className="hover:text-primary  transition-colors">
                                    Issues Map
                                </Link>
                            </li>
                            <li>
                                <Link href="/statistics" className="hover:text-primary transition-colors">
                                    Activity Dashboard
                                </Link>
                            </li>

                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                            Contact & Support
                        </h3>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>City Hall Plaza, Scarborough, ON</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone className="w-4 h-4 text-primary shrink-0" />
                                <span>+1 (800) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail className="w-4 h-4 text-primary shrink-0" />
                                <span>support@ourcityvoice.org</span>
                            </li>
                        </ul>
                    </div>

                    <div className="w-full max-w-62.5 space-y-3">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider ">
                            Stay Updated
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Subscribe to receive monthly civic reports and infrastructure updates.
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-2">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full pl-3 pr-10 py-2 bg-section border border-border-custom rounded-lg text-xs font-medium text-muted-foreground placeholder:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary hover:bg-primary-hover text-white rounded-md flex items-center justify-center transition-colors cursor-pointer"
                                    aria-label="Subscribe"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                <div className="border-t border-border-custom/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground">
                    <p>© {new Date().getFullYear()} OurCityVoice. All rights reserved.</p>

                    <div className="flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-tag-green-text" />
                        <span>Developed by DreamLab IT</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                            Privacy Policy
                        </Link>
                        <span>•</span>
                        <Link href="/terms-of-service" className="hover:text-primary transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>

            </SectionContainer>
        </footer>
    );
}