"use server";

import { redirect } from "next/navigation";

export type RegisterFormState = {
    error?: string;
    success?: boolean;
};

export async function registerAction(
    prevState: RegisterFormState,
    formData: FormData
): Promise<RegisterFormState> {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const imageFile = formData.get("avatar") as File | null;

    if (!name || !email || !password) {
        return { error: "All required fields must be filled out." };
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters long." };
    }

    let imageUrl = "";

    try {
        if (imageFile && imageFile.size > 0) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", imageFile);
            uploadFormData.append(
                "upload_preset",
                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_preset"
            );

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            if (cloudName) {
                const cloudRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                        method: "POST",
                        body: uploadFormData,
                    }
                );
                const cloudData = await cloudRes.json();
                if (cloudData.secure_url) {
                    imageUrl = cloudData.secure_url;
                }
            }
        }

        console.log("Registering User:", { name, email, password, imageUrl });

        await new Promise((resolve) => setTimeout(resolve, 1200));

    } catch (err) {
        return { error: "Registration failed. Please try again." };
    }

    redirect("/login");
}