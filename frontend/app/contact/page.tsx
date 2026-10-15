
import { getContactCategories } from "@/app/actions/contact";
import ContactPage from "@/components/contact/ContactPage";
export const dynamic = "force-dynamic";
export default async function Page() {
    const result = await getContactCategories();

    return (
        <ContactPage
            categories={result.success ? result.categories : []}
        />
    );
}