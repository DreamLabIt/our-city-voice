import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import { getCurrentUser } from "@/lib/session";
import { getAdminContactMessages } from "@/app/actions/contact";
import type { ContactMessage } from "@/types/contact";
import ContactMessagesTable from "@/components/contact/ContactMessagesTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard/contact-messages";
const LIMIT = 16;

function getValidPage(value?: string): number {
    const page = Number(value);
    return Number.isInteger(page) && page >= 1 ? page : 1;
}

interface PageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

export default async function AdminContactMessagesPage({ searchParams }: PageProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect(`/login?next=${BASE_PATH}`);
    }

    const isAdmin = user.role === "super_admin";

    if (!isAdmin) {
        redirect("/dashboard");
    }

    const params = await searchParams;
    const currentPage = getValidPage(params.page);

    const result = await getAdminContactMessages({
        page: currentPage,
        limit: LIMIT,
    });

    const messages: ContactMessage[] = result.success ? result.messages : [];
    const total = result.total || 0;
    const totalPages = result.pageCount || 1;

    return (
        <DashboardLayout user={user} isAdmin={isAdmin}>
            <ContactMessagesTable
                messages={messages}
                total={total}
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={BASE_PATH}
            />
        </DashboardLayout>
    );
}