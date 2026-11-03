
import type { Metadata } from "next";
import { getContactCategories } from "@/app/actions/contact";
import ContactPage from "@/components/contact/ContactPage";

export const metadata: Metadata = {
    title: "Contact Us | Our City Voice",
    description:
        "Contact the Our City Voice team with questions, feedback, or requests for support.",
};

export const dynamic = "force-dynamic";
export default async function Page() {
    const result = await getContactCategories();

    return (
        <ContactPage
            categories={result.success ? result.categories : []}
        />
    );
}