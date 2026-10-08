"use client";

import React, { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, User, Phone, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import type { AuthUser, FormState } from "@/types";
import { updateProfileAction } from "@/app/actions/profile";

interface ProfileFormProps {
    user: AuthUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState<FormState, FormData>(
        updateProfileAction,
        {}
    );

    const [emailValue, setEmailValue] = useState(user?.email ?? "");
    const [showPasswordInput, setShowPasswordInput] = useState(false);

    const isEmailChanged = emailValue.trim().toLowerCase() !== (user?.email ?? "").toLowerCase();

    useEffect(() => {
        if (state.fieldErrors?.currentPassword) {
            setShowPasswordInput(true);
        }
    }, [state.fieldErrors]);

    return (
        <Card className="rounded-2xl border-border shadow-xs">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-extrabold">Personal Details</CardTitle>
                <CardDescription className="text-xs">
                    Update your account details and contact information.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {state.error && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{state.error}</span>
                    </div>
                )}

                {state.success && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Profile updated successfully!</span>
                    </div>
                )}

                <form action={formAction} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-bold">
                                <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                key={user?.name}
                                defaultValue={user?.name ?? ""}
                                placeholder="Enter your full name"
                                className="h-10 rounded-xl text-xs"
                                required
                            />
                            {state.fieldErrors?.name && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {state.fieldErrors.name[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={emailValue}
                                onChange={(e) => setEmailValue(e.target.value)}
                                placeholder="Enter your email address"
                                className="h-10 rounded-xl text-xs"
                                required
                            />
                            {state.fieldErrors?.email && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {state.fieldErrors.email[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-bold">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                key={user?.phone}
                                defaultValue={user?.phone ?? ""}
                                placeholder="+880 1XXXX-XXXXXX"
                                className="h-10 rounded-xl text-xs"
                            />
                            {state.fieldErrors?.phone && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {state.fieldErrors.phone[0]}
                                </p>
                            )}
                        </div>

                        {(isEmailChanged || showPasswordInput) && (
                            <div className="space-y-1.5">
                                <Label htmlFor="currentPassword" className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                    <Lock className="h-3.5 w-3.5" /> Current Password Required
                                </Label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    placeholder="Enter password to confirm email change"
                                    className="h-10 rounded-xl border-amber-500/50 text-xs focus-visible:ring-amber-500"
                                    required={isEmailChanged}
                                />
                                {state.fieldErrors?.currentPassword && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {state.fieldErrors.currentPassword[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-9 gap-2 rounded-xl px-5 text-xs font-bold"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}