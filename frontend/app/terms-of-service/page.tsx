// import React from "react";
// import {
//     FileCheck,
//     AlertCircle,
//     ShieldAlert,
//     Clock,
//     Building2,
//     Ban,
//     FileText,
//     Gavel
// } from "lucide-react";
// import PageHeader from "@/components/common/PageHeader";
// import SectionContainer from "@/components/common/SectionContainer";
// import { Card, CardContent } from "@/components/ui/card";
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// export const metadata = {
//     title: "Terms of Service | One City Voice",
//     description: "Read the Terms of Service for One City Voice to understand user rights, civic reporting guidelines, and platform rules.",
// };

// export default function TermsOfServicePage(): React.ReactNode {
//     const lastUpdated = "October 26, 2026";

//     const coreRules = [
//         {
//             icon: FileCheck,
//             title: "Authentic Reporting",
//             desc: "All submitted civic reports must represent genuine infrastructure hazards, maintenance needs, or community concerns.",
//         },
//         {
//             icon: Ban,
//             title: "No False Information",
//             desc: "Submitting fraudulent reports, deceptive locations, or manipulated photos is strictly prohibited and bannable.",
//         },
//         {
//             icon: ShieldAlert,
//             title: "Respectful Behavior",
//             desc: "Harassment, hate speech, political propaganda, or inappropriate media attachments will be removed immediately.",
//         },
//         {
//             icon: Building2,
//             title: "Municipal Routing",
//             desc: "Reports are processed and forwarded to relevant city departments, but resolution timelines depend on municipal capacity.",
//         },
//     ];

//     const prohibitedActivities = [
//         {
//             title: "Spam & Duplicate Submissions",
//             desc: "Repeatedly submitting identical reports for the same incident within a short timeframe.",
//         },
//         {
//             title: "Defamation & Personal Attacks",
//             desc: "Targeting individuals, city workers, or private properties with abusive or defamatory language.",
//         },
//         {
//             title: "Unauthorized Commercial Use",
//             desc: "Using the platform for advertising businesses, selling products, or scraping public data without permission.",
//         },
//         {
//             title: "Security Exploitation",
//             desc: "Attempting to bypass authentication, probe platform vulnerabilities, or launch denial-of-service attacks.",
//         },
//     ];

//     return (
//         <section className="w-full bg-background text-foreground min-h-screen">
//             <PageHeader
//                 title="Terms of Service & Citizen Agreement"
//                 description={`Please read these terms carefully before submitting reports or interacting on the platform. Effective Date: ${lastUpdated}`}
//                 bgImage="/hero-bg.jpg"
//                 customBreadcrumbName="Terms of Service"
//             />

//             <SectionContainer>
//                 <div className="py-10 sm:py-16 space-y-12 sm:space-y-16 max-w-7xl mx-auto">

//                     <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
//                         <div className="flex items-center gap-3">
//                             <span className="text-xs text-muted-foreground flex items-center gap-1">
//                                 <Clock className="w-3.5 h-3.5" /> Last Revision: {lastUpdated}
//                             </span>
//                         </div>
//                         <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
//                             Welcome to One City Voice Terms & Guidelines
//                         </h2>
//                         <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
//                             By accessing or using <strong>One City Voice</strong>, you agree to be bound by these Terms of Service. This platform empowers citizens to report civic issues and collaborate with municipal authorities. If you do not agree with any part of these terms, please refrain from using our services.
//                         </p>
//                     </div>

//                     <div className="space-y-4">
//                         <h3 className="text-lg font-bold text-foreground">Core Rules of Conduct</h3>
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                             {coreRules.map((item, idx) => {
//                                 const Icon = item.icon;
//                                 return (
//                                     <Card key={idx} className="border border-border/80 bg-card shadow-xs hover:border-primary/40 transition-colors">
//                                         <CardContent className="p-5 space-y-2.5">
//                                             <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
//                                                 <Icon className="w-5 h-5 stroke-2" />
//                                             </div>
//                                             <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
//                                             <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
//                                         </CardContent>
//                                     </Card>
//                                 );
//                             })}
//                         </div>
//                     </div>

//                     <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
//                         <div className="space-y-1">
//                             <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
//                                 <AlertCircle className="w-5 h-5 text-destructive" />
//                                 Prohibited Platform Activities
//                             </h3>
//                             <p className="text-xs text-muted-foreground">
//                                 To maintain a trustworthy community space, the following behaviors are strictly disallowed on One City Voice:
//                             </p>
//                         </div>

//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             {prohibitedActivities.map((act, index) => (
//                                 <div key={index} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
//                                     <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
//                                         <Ban className="w-4 h-4 text-destructive shrink-0" />
//                                         {act.title}
//                                     </h4>
//                                     <p className="text-xs text-muted-foreground leading-relaxed">{act.desc}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
//                         <div className="space-y-1 border-b border-border pb-4">
//                             <h3 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
//                                 <FileText className="w-5 h-5 text-primary" />
//                                 Detailed Terms & Legal Clauses
//                             </h3>
//                             <p className="text-xs text-muted-foreground">
//                                 Review the legal framework governing account management, content ownership, and liability limits.
//                             </p>
//                         </div>

//                         <Accordion {...({
//                             type: "multiple",
//                             defaultValue: ["clause-1"],
//                             className: "w-full",
//                         } as any)}>

//                             <AccordionItem value="clause-1">
//                                 <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
//                                     1. User Account Registration & Security
//                                 </AccordionTrigger>
//                                 <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
//                                     <p>
//                                         You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
//                                     </p>
//                                     <ul className="list-disc pl-5 space-y-1">
//                                         <li>Provide accurate and current information during registration.</li>
//                                         <li>Maintain and promptly update your contact details if they change.</li>
//                                         <li>Notify us immediately of any unauthorized access or security breach.</li>
//                                     </ul>
//                                 </AccordionContent>
//                             </AccordionItem>

//                             <AccordionItem value="clause-2">
//                                 <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
//                                     2. Submission Content Rights & License
//                                 </AccordionTrigger>
//                                 <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
//                                     <p>
//                                         By submitting text, photos, or geographic data (e.g., pothole images, street photos), you retain ownership of your original content. However, you grant One City Voice a non-exclusive, royalty-free, worldwide license to display, reproduce, redistribute, and format the content for municipal dispatch and public awareness.
//                                     </p>
//                                 </AccordionContent>
//                             </AccordionItem>

//                             <AccordionItem value="clause-3">
//                                 <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
//                                     3. Emergency Issues Disclaimer
//                                 </AccordionTrigger>
//                                 <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
//                                     <p className="text-destructive font-semibold">
//                                         DO NOT USE THIS PLATFORM FOR IMMEDIATE LIFE-THREATENING EMERGENCIES.
//                                     </p>
//                                     <p>
//                                         One City Voice is a non-emergency civic tracking portal. For urgent threats such as active fires, ongoing crimes, active gas leaks, or medical emergencies, please immediately dial national emergency hotline services (e.g., 999 / 911).
//                                     </p>
//                                 </AccordionContent>
//                             </AccordionItem>

//                             <AccordionItem value="clause-4">
//                                 <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
//                                     4. Account Termination & Suspension
//                                 </AccordionTrigger>
//                                 <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
//                                     <p>
//                                         We reserve the right to suspend or terminate user accounts, restrict access, or delete submitted reports without prior notice if a user violates these Terms of Service or engages in fraudulent activity.
//                                     </p>
//                                 </AccordionContent>
//                             </AccordionItem>

//                             <AccordionItem value="clause-5">
//                                 <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
//                                     5. Limitation of Liability
//                                 </AccordionTrigger>
//                                 <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
//                                     <p>
//                                         One City Voice acts as an intermediary communication bridge between residents and local government entities. While we strive for prompt transmission, we do not guarantee exact resolution timelines or repairs, as physical execution rests with respective government contractors and municipal departments.
//                                     </p>
//                                 </AccordionContent>
//                             </AccordionItem>

//                             <AccordionItem value="clause-6">
//                                 <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
//                                     6. Modifications to Terms
//                                 </AccordionTrigger>
//                                 <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
//                                     <p>
//                                         We may revise these Terms of Service periodically to reflect changes in local regulations or platform features. Continued use of the platform after updates constitutes acceptance of the modified terms.
//                                     </p>
//                                 </AccordionContent>
//                             </AccordionItem>

//                         </Accordion>
//                     </div>

//                     <div className="bg-muted/40 border border-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
//                         <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
//                             <Gavel className="w-7 h-7" />
//                         </div>
//                         <div className="space-y-1 text-center md:text-left flex-1">
//                             <h4 className="text-base font-bold text-foreground">Governing Law</h4>
//                             <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
//                                 These Terms shall be governed by and construed in accordance with local municipal regulations and applicable national digital communications laws.
//                             </p>
//                         </div>
//                     </div>


//                 </div>
//             </SectionContainer>
//         </section>
//     );
// }







import React from "react";
import Metadata from "next";
import {
    FileCheck,
    AlertCircle,
    ShieldAlert,
    Clock,
    Building2,
    Ban,
    FileText,
    Gavel
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { RuleItem, ProhibitedActivity } from "@/types";

export const metadata = {
    title: "Terms of Service | One City Voice",
    description: "Read the Terms of Service for One City Voice to understand user rights, civic reporting guidelines, and platform rules.",
};


export default function TermsOfServicePage(): React.ReactNode {
    const lastUpdated = "October 26, 2026";

    const coreRules: RuleItem[] = [
        {
            icon: FileCheck,
            title: "Authentic Reporting",
            desc: "All submitted civic reports must represent genuine infrastructure hazards, maintenance needs, or community concerns.",
        },
        {
            icon: Ban,
            title: "No False Information",
            desc: "Submitting fraudulent reports, deceptive locations, or manipulated photos is strictly prohibited and bannable.",
        },
        {
            icon: ShieldAlert,
            title: "Respectful Behavior",
            desc: "Harassment, hate speech, political propaganda, or inappropriate media attachments will be removed immediately.",
        },
        {
            icon: Building2,
            title: "Municipal Routing",
            desc: "Reports are processed and forwarded to relevant city departments, but resolution timelines depend on municipal capacity.",
        },
    ];

    const prohibitedActivities: ProhibitedActivity[] = [
        {
            title: "Spam & Duplicate Submissions",
            desc: "Repeatedly submitting identical reports for the same incident within a short timeframe.",
        },
        {
            title: "Defamation & Personal Attacks",
            desc: "Targeting individuals, city workers, or private properties with abusive or defamatory language.",
        },
        {
            title: "Unauthorized Commercial Use",
            desc: "Using the platform for advertising businesses, selling products, or scraping public data without permission.",
        },
        {
            title: "Security Exploitation",
            desc: "Attempting to bypass authentication, probe platform vulnerabilities, or launch denial-of-service attacks.",
        },
    ];

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Terms of Service & Citizen Agreement"
                description={`Please read these terms carefully before submitting reports or interacting on the platform. Effective Date: ${lastUpdated}`}
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Terms of Service"
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
                            Welcome to One City Voice Terms & Guidelines
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            By accessing or using <strong>One City Voice</strong>, you agree to be bound by these Terms of Service. This platform empowers citizens to report civic issues and collaborate with municipal authorities. If you do not agree with any part of these terms, please refrain from using our services.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Core Rules of Conduct</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {coreRules.map((item, idx) => {
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
                                <AlertCircle className="w-5 h-5 text-destructive" />
                                Prohibited Platform Activities
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                To maintain a trustworthy community space, the following behaviors are strictly disallowed on One City Voice:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {prohibitedActivities.map((act, index) => (
                                <div key={index} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Ban className="w-4 h-4 text-destructive shrink-0" />
                                        {act.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{act.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
                        <div className="space-y-1 border-b border-border pb-4">
                            <h3 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Detailed Terms & Legal Clauses
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Review the legal framework governing account management, content ownership, and liability limits.
                            </p>
                        </div>

                        <Accordion {...({
                            type: "multiple",
                            defaultValue: ["clause-1"],
                            className: "w-full",
                        } as any)}>
                            <AccordionItem value="clause-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    1. User Account Registration & Security
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Provide accurate and current information during registration.</li>
                                        <li>Maintain and promptly update your contact details if they change.</li>
                                        <li>Notify us immediately of any unauthorized access or security breach.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-2">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    2. Submission Content Rights & License
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        By submitting text, photos, or geographic data (e.g., pothole images, street photos), you retain ownership of your original content. However, you grant One City Voice a non-exclusive, royalty-free, worldwide license to display, reproduce, redistribute, and format the content for municipal dispatch and public awareness.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-3">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    3. Emergency Issues Disclaimer
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p className="text-destructive font-semibold">
                                        DO NOT USE THIS PLATFORM FOR IMMEDIATE LIFE-THREATENING EMERGENCIES.
                                    </p>
                                    <p>
                                        One City Voice is a non-emergency civic tracking portal. For urgent threats such as active fires, ongoing crimes, active gas leaks, or medical emergencies, please immediately dial national emergency hotline services (e.g., 999 / 911).
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-4">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    4. Account Termination & Suspension
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        We reserve the right to suspend or terminate user accounts, restrict access, or delete submitted reports without prior notice if a user violates these Terms of Service or engages in fraudulent activity.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-5">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    5. Limitation of Liability
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        One City Voice acts as an intermediary communication bridge between residents and local government entities. While we strive for prompt transmission, we do not guarantee exact resolution timelines or repairs, as physical execution rests with respective government contractors and municipal departments.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="clause-6">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                    6. Modifications to Terms
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                                    <p>
                                        We may revise these Terms of Service periodically to reflect changes in local regulations or platform features. Continued use of the platform after updates constitutes acceptance of the modified terms.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="bg-muted/40 border border-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Gavel className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 text-center md:text-left flex-1">
                            <h4 className="text-base font-bold text-foreground">Governing Law</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                These Terms shall be governed by and construed in accordance with local municipal regulations and applicable national digital communications laws.
                            </p>
                        </div>
                    </div>

                </div>
            </SectionContainer>
        </section>
    );
}