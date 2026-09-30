import PageHeader from "@/components/common/PageHeader";

export default function StatisticsPage() {
    return (
        <section>
            <PageHeader
                title="Platform Statistics"
                description={
                    <>
                        Explore real-time insights, infrastructure issue reports,
                        <br />
                        and resolution trends across the city.
                    </>
                }
                customBreadcrumbName="Statistics"
                bgImage="/hero-bg.jpg"
            />

        </section>
    );
}