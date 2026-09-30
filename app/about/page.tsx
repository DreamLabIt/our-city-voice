import PageHeader from "@/components/common/PageHeader";

export default function AboutPage() {
    return (
        <section>
            <PageHeader
                title="About Our Platform"
                description="Learn about our mission to improve local infrastructure together."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="About Us"
            />
        </section>
    );
}