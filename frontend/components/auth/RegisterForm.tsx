"use client";

import { useState, useTransition } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { registerAction } from "@/app/actions/register";

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
import { AlertCircle, Loader2, Lock, Mail, User, Upload, CheckCircle2 } from "lucide-react";
import type { RegisterInputs } from "@/types";

export default function RegisterForm() {
    const [serverError, setServerError] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const [fileName, setFileName] = useState<string>("");

    const form = useForm<RegisterInputs>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            avatar: null,
        },
    });

    const onSubmit = (data: RegisterInputs) => {
        setServerError("");

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);

        if (data.avatar && data.avatar.length > 0) {
            formData.append("avatar", data.avatar[0]);
        }

        startTransition(async () => {
            const res = await registerAction({ error: "" }, formData);
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
                    name="name"
                    rules={{
                        required: "Full Name is required",
                        minLength: {
                            value: 2,
                            message: "Name must be at least 2 characters",
                        },
                    }}
                    render={({ field }: { field: ControllerRenderProps<RegisterInputs, "name"> }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-semibold">Full Name</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        {...field}
                                        type="text"
                                        placeholder="John Doe"
                                        className="pl-10 h-10 rounded-xl bg-background border-border text-xs sm:text-sm"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

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
                    render={({ field }: { field: ControllerRenderProps<RegisterInputs, "email"> }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-semibold">Email Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        {...field}
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10 h-10 rounded-xl bg-background border-border text-xs sm:text-sm"
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
                    render={({ field }: { field: ControllerRenderProps<RegisterInputs, "password"> }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-semibold">Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        {...field}
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-10 rounded-xl bg-background border-border text-xs sm:text-sm"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field: { onChange, ref, name } }: { field: ControllerRenderProps<RegisterInputs, "avatar"> }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-semibold">
                                Profile Image (Optional)
                            </FormLabel>
                            <FormControl>
                                <div className="relative flex items-center">
                                    <input
                                        type="file"
                                        id="avatar"
                                        name={name}
                                        ref={ref}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length > 0) {
                                                setFileName(files[0].name);
                                                onChange(files);
                                            } else {
                                                setFileName("");
                                                onChange(null);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="avatar"
                                        className="w-full flex items-center justify-between px-3.5 h-10 rounded-xl border border-dashed border-border bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground cursor-pointer transition-colors"
                                    >
                                        <span className="truncate max-w-55">
                                            {fileName ? fileName : "Choose profile photo..."}
                                        </span>
                                        {fileName ? (
                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                        ) : (
                                            <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                                        )}
                                    </label>
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-10 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm mt-2"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        <span>Create Account</span>
                    )}
                </Button>
            </form>
        </Form>
    );
}