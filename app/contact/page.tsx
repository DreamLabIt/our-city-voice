import PageHeader from "@/components/common/PageHeader";

export default function ContactPage() {
    return (
        <section>
            <PageHeader
                title="Contact Us"
                description={
                    <>
                        Have questions or feedback?
                        <br />
                        Get in touch with our team and we will get back to you as soon as possible.
                    </>
                }
                customBreadcrumbName="Contact Us"
                bgImage="/hero-bg.jpg"
            />
        </section>
    );
}