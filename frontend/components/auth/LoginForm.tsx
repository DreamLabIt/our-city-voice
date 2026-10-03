"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { loginAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import type { LoginInputs, FormState } from "@/types";

export default function LoginForm() {
    const [serverError, setServerError] = useState<string>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<LoginInputs>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (data: LoginInputs) => {
        setServerError("");

        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);

        startTransition(async () => {
            const initialState: FormState = { error: "" };
            const res = await loginAction(initialState, formData);
            if (res?.error) {
                setServerError(res.error);
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                    <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{serverError}</span>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="email"
                    rules={{
                        required: "Email address is required",
                        pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            message: "Please enter a valid email address",
                        },
                    }}
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-xs sm:text-sm font-semibold">
                                Email Address
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        {...field}
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10 h-10 sm:h-11 rounded-xl bg-background border-border text-xs sm:text-sm"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    rules={{
                        required: "Password is required",
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters",
                        },
                    }}
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-xs sm:text-sm font-semibold">
                                    Password
                                </FormLabel>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        {...field}
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-10 sm:h-11 rounded-xl bg-background border-border text-xs sm:text-sm"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

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
        </Form>
    );
}