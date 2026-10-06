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
import { useUploads } from "@/hooks/use-uploads";
import type { RegisterInputs } from "@/types";

/** Matches the API's rule. See the note on passwordSchema in auth.controller.ts. */
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterForm() {
    const [serverError, setServerError] = useState<string>("");
    const [isPending, startTransition] = useTransition();

    /**
     * Holds the chosen photo locally and does not send it until this form asks.
     * Choosing one and then closing the tab therefore leaves nothing behind in
     * Cloudinary, which is why the hook lives here and not inside AvatarUpload.
     */
    const uploads = useUploads({ kind: "avatar" });

    const form = useForm<RegisterInputs>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            avatar: null,
        },
    });

    const onSubmit = async (data: RegisterInputs) => {
        setServerError("");

        // The photo goes to Cloudinary now, not when it was chosen. Deliberately
        // outside the transition: progress updates marked as transition work can
        // be deferred, and a progress bar that lags is worse than none.
        const uploaded = await uploads.upload();

        if (uploaded === null) {
            // Which file and why is already shown under the picker, so this only
            // has to say that the account was not created.
            setServerError(
                "Your photo could not be uploaded. Remove it or choose another, then try again.",
            );
            return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        if (uploaded[0]) formData.append("avatarUrl", uploaded[0].url);

        startTransition(async () => {
            const res = await registerAction({ error: "" }, formData);

            // Only failures come back; success redirects away. The upload is not
            // repeated if they fix the field and submit again: upload() skips
            // anything already sent.
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

    /**
     * isSubmitting as well as the two obvious flags. It is what covers the gap
     * between the press and the first "uploading" render, which is otherwise a
     * window where the button is still live and a second click would upload the
     * photo twice.
     */
    const isBusy = form.formState.isSubmitting || uploads.isUploading || isPending;

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

                <AvatarUpload uploads={uploads} disabled={isBusy} />

                <Button
                    type="submit"
                    disabled={isBusy}
                    className="w-full h-10 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm mt-2"
                >
                    {uploads.isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="tabular-nums">
                                Uploading photo... {uploads.progress}%
                            </span>
                        </>
                    ) : isPending ? (
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
