import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import { getCurrentUser } from "@/lib/session";
import { getUsersList } from "@/app/actions/users";
import { isUserRole } from "@/components/dashboard/users/user-utils";
import UsersTable from "@/components/dashboard/users/UsersTable";
import { UsersPageProps } from "@/types/user";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const LIMIT = 20;
const BASE_PATH = "/dashboard/users";
const SEARCH_MAX_LENGTH = 120;

function getValidPage(value?: string): number {
    const page = Number(value);

    return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default async function UsersPage({
    searchParams,
}: UsersPageProps): Promise<React.ReactNode> {
    const user = await getCurrentUser();

    if (!user) {
        redirect(`/login?next=${BASE_PATH}`);
    }

    if (user.role !== "super_admin") {
        redirect("/dashboard");
    }

    const isAdmin = user.role === "super_admin";
    const params = await searchParams;
    const currentPage = getValidPage(params.page);
    const search = params.search?.trim().slice(0, SEARCH_MAX_LENGTH) || "";
    const role = isUserRole(params.role) ? params.role : "";

    const result = await getUsersList(
        currentPage,
        LIMIT,
        search || undefined,
        role || undefined,
    );

    if (!result.success || !result.data) {
        if (result.requiresAuth) {
            redirect(`/login?next=${BASE_PATH}`);
        }

        return (
            <DashboardLayout user={user}>
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm font-medium text-destructive">
                    {result.error ?? "Failed to load users."}
                </div>
            </DashboardLayout>
        );
    }

    const { users, total, pageCount } = result.data;
    const totalPages = pageCount || 1;

    const baseQuery = new URLSearchParams();

    if (search) {
        baseQuery.set("search", search);
    }

    if (role) {
        baseQuery.set("role", role);
    }

    if (users.length === 0 && total > 0 && currentPage > totalPages) {
        const query = new URLSearchParams(baseQuery);
        query.set("page", String(totalPages));
        redirect(`${BASE_PATH}?${query.toString()}`);
    }

    return (
        <DashboardLayout user={user} isAdmin={isAdmin}>
            <UsersTable
                users={users}
                total={total}
                currentPage={currentPage}
                totalPages={totalPages}
                currentUserId={String(user.id)}
                basePath={BASE_PATH}
                baseQuery={baseQuery.toString()}
                filters={{ search, role }}
            />
        </DashboardLayout>
    );
}