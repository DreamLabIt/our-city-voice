import { AuthUser } from ".";
export type UserRole = "user" | "super_admin";


export interface ListUsersResult {
    success: boolean;
    data?: {
        users: AuthUser[];
        total: number;
        page: number;
        limit: number;
        pageCount: number;
    };
    error?: string;
    requiresAuth?: boolean;
    fieldErrors?: Record<string, string[]>;
}
export interface UserDetailResult {
    success: boolean;
    data?: AuthUser;
    error?: string;
    requiresAuth?: boolean;
}

export interface UpdateRoleResult {
    success: boolean;
    data?: AuthUser;
    error?: string;
    requiresAuth?: boolean;
    fieldErrors?: Record<string, string[]>;
}

export interface UsersPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        role?: string;
    }>;
}

export interface UsersTableProps {
    users: AuthUser[];
    total: number;
    currentPage: number;
    totalPages: number;
    currentUserId: string;
    basePath: string;
    baseQuery: string;
    filters: {
        search: string;
        role: string;
    };
}

export interface UserFiltersProps {
    search: string;
    role: string;
}

export interface UserRoleSelectProps {
    userId: string;
    userName: string;
    role: UserRole;
    isSelf: boolean;
}

export interface UserDetailsDialogProps {
    userId: string;
    userName: string;
}
