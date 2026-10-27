import PageHeader from "@/components/common/PageHeader";
import HeroSection from "@/components/about/HeroSection";
import MissionVisionSection from "@/components/about/MissionVisionSection";
import WhyChooseUsSection from "@/components/about/WhyChooseUsSection";
import ImpactStatsSection from "@/components/about/ImpactStatsSection";
import FaqSection from "@/components/about/FaqSection";
import CallToActionSection from "@/components/about/CallToActionSection";
import SectionContainer from "@/components/common/SectionContainer";
import { getPublicStats } from "@/app/actions/statistics";

export const revalidate = 60;

export default async function AboutPage(): Promise<React.ReactNode> {
    const res = await getPublicStats();
    const stats = res.success ? res.stats : null;

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="About Our Platform"
                description="Learn about our mission to empower communities, streamline public reporting, and improve local infrastructure together."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="About Us"
            />
            <SectionContainer>
                <div className="py-12 md:py-16 space-y-16 md:space-y-20">
                    <HeroSection stats={stats} />
                    <MissionVisionSection />
                    <WhyChooseUsSection />
                    <ImpactStatsSection stats={stats} />
                    <FaqSection />
                    <CallToActionSection />
                </div>
            </SectionContainer>
        </section>
    );
}