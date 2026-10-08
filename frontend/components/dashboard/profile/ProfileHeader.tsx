import { User, ShieldCheck, Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AuthUser } from "@/types";

interface ProfileHeaderProps {
    user: AuthUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    const isAdmin = user.role === "super_admin";
    const isEmailVerified = Boolean(user.emailVerifiedAt);

    function initialsOf(name: string): string {
        const letters = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("");

        return letters || "?";
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="h-32 border-b border-border bg-linear-to-r from-primary/20 via-primary/10 to-background sm:h-44" />

            <div className="px-6 pb-6 pt-0">
                <div className="-mt-12 flex flex-col items-start justify-between gap-4 sm:-mt-16 sm:flex-row sm:items-end">
                    <div className="flex w-full flex-col items-center gap-4 text-center sm:w-auto sm:flex-row sm:items-end sm:text-left">
                        <Avatar className="h-24 w-24 border-4 border-card shadow-md sm:h-28 sm:w-28">
                            <AvatarImage
                                src={user.avatarUrl ?? undefined}
                                alt={user.name}
                            />
                            <AvatarFallback className="bg-primary/90 text-3xl font-semibold text-white">
                                {initialsOf(user.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1 mt-20">
                            <div className="mt-20 flex items-center justify-center gap-2 sm:mt-0 sm:justify-start">
                                <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                                    {user.name}
                                </h2>

                                {isAdmin ? (
                                    <Badge
                                        variant="default"
                                        className="gap-1 bg-primary font-bold text-primary-foreground"
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Admin
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 font-bold"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Citizen
                                    </Badge>
                                )}
                            </div>

                            <p className="text-xs font-medium text-muted-foreground">
                                {isAdmin
                                    ? "Administrator account"
                                    : "Active citizen contributing to community improvements."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-9 grid grid-cols-1 gap-3 border-t border-border pt-4 text-xs font-medium text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{user.email}</span>

                        {isEmailVerified ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <AlertCircle className="h-3 w-3" />
                                Unverified
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-primary" />
                        <span>
                            {user.phone || "Not provided"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}