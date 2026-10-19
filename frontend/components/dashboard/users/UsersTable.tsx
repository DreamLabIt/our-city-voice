import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import type { AuthUser } from "@/types";
import UserDetailsDialog from "./UserDetailsDialog";
import UserFilters from "./UserFilters";
import UserRoleSelect from "./UserRoleSelect";
import { formatDate, isUserRole, type UserRole } from "./user-utils";
import { UsersTableProps } from "@/types/user";

const COLUMN_COUNT = 6;

function getPageNumbers(
    currentPage: number,
    totalPages: number,
): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
}

function UserAvatar({ user }: { user: AuthUser }) {
    return (
        <Avatar className="size-9 shrink-0">
            {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
            )}
            <AvatarFallback className="bg-tag-blue-bg text-[11px] font-extrabold text-tag-blue-text">
                {getInitials(user.name) || "?"}
            </AvatarFallback>
        </Avatar>
    );
}

function toRole(value: unknown): UserRole {
    return isUserRole(value) ? value : "user";
}

export default function UsersTable({
    users,
    total,
    currentPage,
    totalPages,
    currentUserId,
    basePath,
    baseQuery,
    filters,
}: UsersTableProps) {
    const pageUrl = (page: number): string => {
        const query = new URLSearchParams(baseQuery);
        query.set("page", String(page));
        return `${basePath}?${query.toString()}`;
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">
                    All Users
                </h1>
                <p className="text-md text-muted-foreground">
                    Total <span className="px-1 text-primary">{total}</span>{" "}
                    {total === 1 ? "User" : "Users"}
                </p>
            </div>

            <UserFilters search={filters.search} role={filters.role} />

            <div className="hidden rounded-xl border border-border bg-card md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border">
                            <TableHead className="pl-4">User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="pr-5 text-right">
                                Details
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={COLUMN_COUNT}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="border-t border-border pl-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={user} />
                                            <span className="max-w-48 truncate font-medium">
                                                {user.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-56 truncate border-t border-border">
                                        {user.email}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap border-t border-border">
                                        {user.phone || "-"}
                                    </TableCell>
                                    <TableCell className="border-t border-border">
                                        <UserRoleSelect
                                            userId={String(user.id)}
                                            userName={user.name}
                                            role={toRole(user.role)}
                                            isSelf={
                                                String(user.id) === currentUserId
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap border-t border-border">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="border-t border-border pr-5 text-right">
                                        <UserDetailsDialog
                                            userId={String(user.id)}
                                            userName={user.name}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="space-y-3 md:hidden">
                {users.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No users found.
                        </CardContent>
                    </Card>
                ) : (
                    users.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <UserAvatar user={user} />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <UserDetailsDialog
                                        userId={String(user.id)}
                                        userName={user.name}
                                    />
                                </div>

                                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>
                                        <dt className="font-semibold">Phone</dt>
                                        <dd>{user.phone || "-"}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold">Joined</dt>
                                        <dd>{formatDate(user.createdAt)}</dd>
                                    </div>
                                </dl>

                                <UserRoleSelect
                                    userId={String(user.id)}
                                    userName={user.name}
                                    role={toRole(user.role)}
                                    isSelf={String(user.id) === currentUserId}
                                />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={pageUrl(Math.max(1, currentPage - 1))}
                                aria-disabled={currentPage <= 1}
                                className={
                                    currentPage <= 1
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                }
                            />
                        </PaginationItem>

                        {getPageNumbers(currentPage, totalPages).map(
                            (page, index) => (
                                <PaginationItem key={`${page}-${index}`}>
                                    {page === "ellipsis" ? (
                                        <PaginationEllipsis />
                                    ) : (
                                        <PaginationLink
                                            href={pageUrl(page)}
                                            isActive={currentPage === page}
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ),
                        )}

                        <PaginationItem>
                            <PaginationNext
                                href={pageUrl(
                                    Math.min(totalPages, currentPage + 1),
                                )}
                                aria-disabled={currentPage >= totalPages}
                                className={
                                    currentPage >= totalPages
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}