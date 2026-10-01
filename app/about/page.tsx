"use client";

import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Image from "next/image";
import Link from "next/link";
import {
    Target,
    Eye,
    ShieldCheck,
    Users,
    CheckCircle2,
    ArrowRight,
    MapPin,
    BarChart3,
    Clock,
    ChevronDown,
    HelpCircle,
    FileText,
    HeartHandshake,
} from "lucide-react";
import { faqs } from "@/data/mock-data";

export default function AboutPage(): React.ReactNode {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="About Our Platform"
                description="Learn about our mission to empower communities, streamline public reporting, and improve local infrastructure together."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="About Us"
            />

            <div className="max-w-[1940px] mx-auto px-8 md:px-10 py-12 md:py-16 space-y-16 md:space-y-20">

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                    <div className="lg:col-span-6 space-y-6">

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight max-w-180">
                            Bridging the Gap Between <span className="text-primary">Citizens</span> & <span className="text-primary">City Authorities</span>
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            OurCityVoice is a community-driven civic management system designed to make city infrastructure reporting seamless, transparent, and actionable. From pothole repairs to street light outage fixes, we empower residents to report issues and track resolutions in real time.
                        </p>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            By fostering collaboration between active citizens and municipality teams, we are building cleaner, safer, and more resilient urban environments for everyone.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-4">
                            <Link
                                href="/reports"
                                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Explore Recent Reports</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/contact"
                                className="px-6 py-3 bg-section hover:bg-card border border-border-custom text-foreground font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <HeartHandshake className="w-4 h-4 text-primary" />
                                <span>Contact Our Team</span>
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-6 relative">
                        <div className="relative w-full h-80 sm:h-105 rounded-2xl overflow-hidden border border-border-custom shadow-xl">
                            <Image
                                src="/isue.jpeg"
                                alt="Community Infrastructure Project"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

                            <div className="absolute bottom-4 left-6 right-6 bg-card/60 p-5 rounded-xl shadow-lg flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Impact Created</p>
                                    <p className="text-xl sm:text-2xl font-extrabold text-foreground">12,500+ Issues Resolved</p>
                                </div>
                                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border-custom p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-all border-l-6 border-l-primary/80">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Target className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span>Our Mission</span>
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To provide an accessible, transparent, and technology-driven platform that empowers citizens to report local infrastructure issues and hold civic bodies accountable.
                        </p>
                    </div>

                    <div className="bg-card border border-border-custom p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-all border-l-6 border-l-primary/80">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Eye className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span>Our Vision</span>
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To become the leading digital ecosystem for smart cities, where citizen participation directly shapes modern, well-maintained, and sustainable urban infrastructure.
                        </p>
                    </div>

                    <div className="bg-card border border-border-custom p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-all border-l-6 border-l-primary/80">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span>Our Values</span>
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Transparency in progress, inclusivity in civic engagement, rapid response time, and trust between neighborhood communities and municipal teams.
                        </p>
                    </div>
                </section>

                <section className="bg-section border border-border-custom rounded-3xl p-8 sm:p-12 md:p-16 space-y-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3">

                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                            Why Choose OurCityVoice?
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-150 mx-auto">
                            Designed with ease-of-use and speed in mind, providing an end-to-end workflow for civic problem reporting.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3 text-center sm:text-left pr-2">
                            <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-base text-foreground">Geo-Tagged Reporting</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Pinpoint exact locations of damages, road cracks, or broken street lights directly on an interactive map.
                            </p>
                        </div>

                        <div className="space-y-3 text-center sm:text-left border-l-2 border-border-custom -ml-10 pl-8 pr-2">
                            <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-base text-foreground">Real-Time Status Tracking</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Receive instant email or in-app updates as your reported issue moves from submitted to resolved.
                            </p>
                        </div>

                        <div className="space-y-3 text-center sm:text-left lg:border-l-2 border-border-custom -ml-8 pl-8 pr-2">
                            <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                                <Users className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-base text-foreground">Community Upvoting</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Neighbors can upvote critical issues to highlight urgent repairs to local authorities faster.
                            </p>
                        </div>

                        <div className="space-y-3 text-center sm:text-left border-l-2 border-border-custom -ml-8 pl-8">
                            <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-base text-foreground">Open Data Analytics</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Transparent dashboards showing city-wide resolution rates and active maintenance progress.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                            <FileText className="w-5 h-5" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">15,000+</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Reports Submitted</p>
                    </div>

                    <div className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">88%</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resolution Success Rate</p>
                    </div>

                    <div className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                            <Clock className="w-5 h-5" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">48 Hours</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Response Time</p>
                    </div>

                    <div className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                            <Users className="w-5 h-5" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">50,000+</p>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Community Members</p>
                    </div>
                </section>

                <section className="space-y-10">
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-140 mx-auto">
                            Find quick answers to common questions about how our platform works and how you can participate.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {faqs.map((faq, index) => {
                            const isOpen = openFaqIndex === index;
                            return (
                                <div
                                    key={index}
                                    className="bg-card border border-border-custom rounded-2xl transition-all duration-200 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-base sm:text-lg hover:text-primary transition-colors focus:outline-none"
                                    >
                                        <span className="flex items-center gap-3">
                                            <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                                            {faq.question}
                                        </span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""
                                                }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border-custom/50 pt-4">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-linear-to-r from-primary/4 via-primary/8 to-transparent border border-primary/10 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center justify-center md:justify-start gap-2">
                            <span>Ready to Make Your Neighborhood Better?</span>
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-120">
                            Join thousands of residents already reporting issues and transforming city infrastructure today.
                        </p>
                    </div>

                    <Link
                        href="/report-issue"
                        className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-colors shrink-0 shadow-md inline-flex items-center gap-2"
                    >
                        <span>Report an Issue Now</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>

            </div>
        </section>
    );
}