import React from "react";
import PageHeader from "@/components/common/PageHeader";
import IssuesMapLayout from "@/components/issues-map/IssuesMapLayout";
import SectionContainer from "@/components/common/SectionContainer";

export default function IssuesMapPage(): React.ReactNode {
    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Issues Map"
                description={
                    <>
                        Explore reported community issues on the interactive map <br />
                        and track local infrastructure updates in real time.
                    </>
                }
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Issues Map"
            />
            <SectionContainer className="py-12">
                <IssuesMapLayout />
            </SectionContainer>
        </section>
    );
}