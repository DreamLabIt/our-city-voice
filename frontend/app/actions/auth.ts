"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/types";

export async function loginAction(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    try {
        console.log("Logging in with:", email);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (email !== "admin@example.com" || password !== "123456") {
            return { error: "Invalid email or password." };
        }
    } catch (err) {
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/dashboard");
}

export async function forgotPasswordAction(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const email = formData.get("email") as string;

    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return {
            error: "Please enter a valid email address.",
        };
    }

    try {

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
            success: true,
        };
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return {
            error: "Something went wrong. Please try again later.",
        };
    }
}