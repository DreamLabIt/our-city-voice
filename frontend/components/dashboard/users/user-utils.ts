export type UserRole = "user" | "super_admin";

export const ROLE_LABEL: Record<UserRole, string> = {
    user: "User",
    super_admin: "Super admin",
};

export const ROLE_STYLES: Record<UserRole, string> = {
    user: "bg-muted text-foreground",
    super_admin: "bg-primary/10 text-primary",
};

export function isUserRole(value: unknown): value is UserRole {
    return value === "user" || value === "super_admin";
}

export function formatDate(value: string | null | undefined): string {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
}