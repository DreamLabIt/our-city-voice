"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordAction } from "@/app/actions/auth";

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
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

type ForgotPasswordInputs = {
    email: string;
};

export default function ForgotPasswordForm() {
    const [serverError, setServerError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<ForgotPasswordInputs>({
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = (data: ForgotPasswordInputs) => {
        setServerError("");
        setSuccessMessage("");

        const formData = new FormData();
        formData.append("email", data.email);

        startTransition(async () => {
            const res = await forgotPasswordAction({ error: "" }, formData);
            if (res?.error) {
                setServerError(res.error);
            } else {
                setSuccessMessage(
                    "Password reset link has been sent to your email address."
                );
                form.reset();
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

                {successMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{successMessage}</span>
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

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Sending link...</span>
                        </>
                    ) : (
                        <span>Send Reset Link</span>
                    )}
                </Button>
            </form>
        </Form>
    );
}