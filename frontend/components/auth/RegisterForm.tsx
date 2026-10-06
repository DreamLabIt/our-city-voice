"use client";

import { useState, useTransition } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";

import { registerAction } from "@/app/actions/register";
import AvatarUpload from "@/components/common/AvatarUpload";
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
import type { RegisterInputs, UploadedFile } from "@/types";

/** Matches the API's rule. See the note on passwordSchema in auth.controller.ts. */
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterForm() {
    const [serverError, setServerError] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    /**
     * The avatar is uploaded as soon as it is chosen, so what is held here is a
     * finished Cloudinary URL. `null` while one is in flight, which is what
     * disables the submit button below: submitting mid-upload would create the
     * account without the photo the person just picked.
     */
    const [avatar, setAvatar] = useState<UploadedFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
        if (avatar) formData.append("avatarUrl", avatar.url);

        startTransition(async () => {
            const res = await registerAction({ error: "" }, formData);

            // Only failures come back; success redirects to the dashboard.
            if (res?.fieldErrors) {
                for (const [field, messages] of Object.entries(res.fieldErrors)) {
                    if (field === "name" || field === "email" || field === "password") {
                        form.setError(field, { message: messages[0] });
                    }
                }
            }
            if (res?.error) setServerError(res.error);
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                    <div
                        role="alert"
                        className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium flex items-center gap-2"
                    >
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
                                        autoComplete="name"
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
                                        autoComplete="email"
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
                            value: MIN_PASSWORD_LENGTH,
                            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
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
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="pl-10 h-10 rounded-xl bg-background border-border text-xs sm:text-sm"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

                <AvatarUpload
                    disabled={isPending}
                    onChange={(file) => {
                        setAvatar(file);
                        setIsUploading(false);
                    }}
                    onUploadingChange={setIsUploading}
                />

                <Button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="w-full h-10 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm mt-2"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Creating account...</span>
                        </>
                    ) : isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Uploading photo...</span>
                        </>
                    ) : (
                        <span>Create Account</span>
                    )}
                </Button>
            </form>
        </Form>
    );
}
