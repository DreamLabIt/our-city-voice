"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, FormState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

const initialState: FormState = {
    error: "",
};

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(
        loginAction,
        initialState
    );

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{state.error}</span>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                    Email Address
                </Label>
                <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        className="pl-10 h-10 sm:h-11 rounded-xl bg-background border-border text-xs sm:text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                        Password
                    </Label>
                    <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>
                <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="pl-10 h-10 sm:h-11 rounded-xl bg-background border-border text-xs sm:text-sm"
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Signing in...</span>
                    </>
                ) : (
                    <span>Sign In</span>
                )}
            </Button>
        </form>
    );
}