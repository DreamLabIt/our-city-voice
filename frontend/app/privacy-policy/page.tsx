import React from "react";
import { Metadata } from "next";
import {
    ShieldCheck,
    Lock,
    Eye,
    FileText,
    Bell,
    Database,
    Clock,
    Scale,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { HighlightItem, DataTypeRow } from "@/types";


export const metadata: Metadata = {
    title: "Privacy Policy | One City Voice",
    description: "Read our comprehensive Privacy Policy to understand how One City Voice protects your personal data, civic reports, and identity.",
};


export default function PrivacyPolicyPage(): React.ReactNode {
    const lastUpdated = "October 26, 2026";

    const highlights: HighlightItem[] = [
        {
            icon: ShieldCheck,
            title: "Data Encryption",
            desc: "All submitted data is encrypted both in transit (TLS 1.3) and at rest using AES-256 standards.",
        },
        {
            icon: Eye,
            title: "Transparent Reporting",
            desc: "Civic reports are made public to hold municipal departments accountable while obscuring personal identity.",
        },
        {
            icon: Lock,
            title: "No Data Monetization",
            desc: "We do not sell, rent, or trade your personal data to commercial advertisers or third-party brokers.",
        },
        {
            icon: Bell,
            title: "Direct Issue Updates",
            desc: "Notifications are sent solely to update you on progress, resolution, or officer notes regarding your reports.",
        },
    ];

    const dataTypes: DataTypeRow[] = [
        {
            category: "Personal Identifiers",
            items: "Full Name, Email Address, Phone Number, Residential Ward, Account Password (Hashed)",
            purpose: "Account authentication, verifying report authenticity, and notifying status updates.",
        },
        {
            category: "Civic Incident Data",
            items: "Photos, Videos, Issue Descriptions, Street Addresses, GPS Coordinates",
            purpose: "Forwarding precise road, water, or safety hazard details to municipal resolution teams.",
        },
        {
            category: "Usage & Metadata",
            items: "IP Address, Device Type, Operating System, Browser Type, Page Interaction Logs",
            purpose: "Preventing spam submissions, rate-limiting malicious bots, and optimizing platform performance.",
        },
        {
            category: "Community Engagement",
            items: "Upvotes/Endorsements, Public Comments, Bookmark Preferences",
            purpose: "Prioritizing urgent civic issues based on community feedback across wards.",
        },
    ];

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Privacy Policy & Data Protection"
                description={`Our commitment to protecting your personal information while ensuring municipal transparency. Effective Date: ${lastUpdated}`}
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Privacy Policy"
            />

            <SectionContainer>
                <div className="py-10 sm:py-16 space-y-12 sm:space-y-16 max-w-7xl mx-auto">

                    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Last Revision: {lastUpdated}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                            Your Privacy & Community Trust are Our Top Priorities
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Welcome to <strong>One City Voice</strong>. We provide a bridge between citizens and municipal departments to solve urban issues efficiently. This Privacy Policy details how we collect, store, share, and protect your personal data when you use our web platform, submit civic reports, or endorse issues.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Core Privacy Guarantees</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {highlights.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <Card key={idx} className="border border-border/80 bg-card shadow-xs hover:border-primary/40 transition-colors">
                                        <CardContent className="p-5 space-y-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Icon className="w-5 h-5" strokeWidth={2} />
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" />
                                Summary of Information We Collect
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                We categorize data collection to ensure complete transparency regarding why each data point is requested.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="p-3 font-bold text-foreground">Data Category</th>
                                        <th className="p-3 font-bold text-foreground">Collected Items</th>
                                        <th className="p-3 font-bold text-foreground">Primary Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {dataTypes.map((row, index) => (
                                        <tr key={index} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-semibold text-primary whitespace-nowrap">{row.category}</td>
                                            <td className="p-3 text-foreground/80">{row.items}</td>
                                            <td className="p-3 text-muted-foreground">{row.purpose}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
                        <div className="space-y-1 border-b border-border pb-4">
                            <h3 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Detailed Policy Clauses
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Click on any section below to read comprehensive details regarding our legal and technical safeguards.
                            </p>
                        </div>

                        <Accordion {...({
                            type: "multiple",
                            defaultValue: ["clause-1"],
                            className: "w-full",
                        } as any)}>
                            <AccordionItem value="clause-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    1. How Public Reporting Works vs Private Data
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
                                    <p>
                                        One City Voice is a public civic platform. When you post a report regarding infrastructure issues (e.g., potholes, flooding, streetlights), the following details are <strong>PUBLICLY VISIBLE</strong>:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Report title, category, media attachments (photos/videos), and ward location.</li>
                                        <li>Reporter initials or display name (unless you choose anonymous submission).</li>
                                        <li>Timestamps, department assignments, and resolution updates.</li>
                                    </ul>
                                    <p>
                                        The following items are kept <strong>STRICTLY PRIVATE</strong> and are never published on the public map or report cards:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Your full personal phone number and personal email address.</li>
                                        <li>Your precise home billing address (unless it is identical to the reported issue location).</li>
                                        <li>Your password hashes and IP logging records.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-2">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    2. Sharing Data with Municipal Authorities & Contractors
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        To resolve reported civic issues, we route report information to authorized government units, such as the <em>Transportation Services Department</em>, <em>Water & Sewerage Board</em>, or assigned field officers.
                                    </p>
                                    <p>
                                        In cases where field officers need clarification regarding a hazard, designated municipal personnel may contact you directly via email or phone. Third-party contractors dispatched by the city are legally bound by non-disclosure agreements and are prohibited from using your contact details for any secondary purpose.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-3">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    3. Cookies & Tracking Technologies
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        We use essential cookies and session storage to maintain your authentication status, remember your ward filter preferences, and keep you logged in.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Essential Cookies:</strong> Required for secure login, CSRF protection, and navigation.</li>
                                        <li><strong>Preference Cookies:</strong> Remember your preferred dark/light theme and location filters.</li>
                                        <li><strong>Analytics Cookies:</strong> Help us measure platform performance and aggregate report statistics.</li>
                                    </ul>
                                    <p>You can adjust cookie management settings in your web browser at any time.</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-4">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    4. Data Retention & Deletion Policy
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        We retain civic report data for historical, analytical, and public accountability purposes. Resolved reports remain in our civic archives to track municipal infrastructure durability over time.
                                    </p>
                                    <p>
                                        If you choose to delete your account, your personal identifying markers (name, email, phone) will be permanently purged or anonymized from our active databases within 30 days.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-5">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    5. Children's Data Protection
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        Our services are intended for individuals who are at least 13 years of age. We do not knowingly collect personal data from children under 13. If we discover that a child under 13 has provided us with personal contact information, we immediately remove such records from our databases.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-6">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    6. Your Rights Under Privacy Regulations
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>Depending on your jurisdiction, you have the following rights regarding your personal data:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you.</li>
                                        <li><strong>Right to Rectification:</strong> Request correction of inaccurate profile data.</li>
                                        <li><strong>Right to Erasure:</strong> Request the deletion of your account and personal history.</li>
                                        <li><strong>Right to Object:</strong> Opt out of non-essential emails or communications.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="bg-muted/40 border border-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Scale className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 text-center md:text-left flex-1">
                            <h4 className="text-base font-bold text-foreground">Updates to This Privacy Policy</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                As municipal integrations expand, we may update this policy. We will notify users of any substantial revisions via email or prominent platform banners prior to changes taking effect.
                            </p>
                        </div>
                    </div>

                </div>
            </SectionContainer>
        </section>
    );
}