"use client";

import { User, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ProfileHeaderProps } from "@/types"

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    const isAdmin = user.role === "super_admin";
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
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="h-32 sm:h-44 bg-linear-to-r from-primary/20 via-primary/10 to-background border-b border-border" />

            <div className="px-6 pb-6 pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 sm:-mt-16 gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left w-full sm:w-auto">
                        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-card shadow-md">
                            <AvatarImage
                                src={user.avatarUrl ?? undefined}
                                alt={user.name}
                            />
                            <AvatarFallback className="bg-primary/90 font-semibold text-white text-3xl">
                                {initialsOf(user.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1 ">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-20">
                                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    {user.name}
                                </h2>
                                {isAdmin ? (
                                    <Badge variant="default" className="gap-1 bg-primary text-primary-foreground font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1 font-bold">
                                        <User className="w-3.5 h-3.5" /> Citizen
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                {user.bio || "Active citizen contributing to community improvements."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{user.phone || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span>{user.location || "Jamalpur, Bangladesh"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}