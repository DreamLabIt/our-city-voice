import { CheckCircle2 } from "lucide-react";

import { getCurrentUser } from "@/lib/session";

/**
 * Deliberately empty.
 *
 * Its whole job right now is to prove the chain works end to end: the form
 * posted to a server action, the action got tokens from the API, the tokens went
 * into httpOnly cookies, proxy.ts let the request through, and this page read
 * the account back out of the database. Every field below came the long way
 * round.
 *
 * Real sections go here once there are endpoints behind them.
 */
export default async function DashboardPage() {
    // The layout already redirected if this is null; it is re-read here rather
    // than threaded down, because a layout cannot pass props to a page.
    const user = await getCurrentUser();
    if (!user) return null;

    const joined = new Intl.DateTimeFormat("en-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(user.createdAt));

    const rows: Array<[string, string]> = [
        ["Name", user.name],
        ["Email", user.email],
        ["Role", user.role === "super_admin" ? "Super admin" : "User"],
        ["Account id", user.id],
        ["Joined", joined],
        ["Email verified", user.emailVerifiedAt ? "Yes" : "Not yet"],
    ];

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Nothing here yet. Reports, comments and account settings will live on this
                    page once the endpoints behind them exist.
                </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border-custom bg-card text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>
                    You are signed in. This page read your account from the database, so the API,
                    the session cookies and the database are all working.
                </span>
            </div>

            <section className="rounded-xl border border-border-custom bg-card overflow-hidden">
                <h2 className="text-sm font-semibold px-5 py-3 border-b border-border-custom">
                    Your account
                </h2>
                <dl className="divide-y divide-border-custom/60">
                    {rows.map(([label, value]) => (
                        <div
                            key={label}
                            className="px-5 py-3 flex items-baseline justify-between gap-4 text-sm"
                        >
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="font-medium text-right break-all">{value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {user.role === "super_admin" && (
                <section className="rounded-xl border border-border-custom bg-card p-5 space-y-2">
                    <h2 className="text-sm font-semibold">User management</h2>
                    <p className="text-sm text-muted-foreground">
                        Your account can list users and change their roles. The endpoints are
                        live, the screen is not built yet.
                    </p>
                    <ul className="text-xs text-muted-foreground font-mono space-y-1 pt-1">
                        <li>GET /api/v1/users</li>
                        <li>GET /api/v1/users/:id</li>
                        <li>PATCH /api/v1/users/:id/role</li>
                    </ul>
                </section>
            )}
        </div>
    );
}
