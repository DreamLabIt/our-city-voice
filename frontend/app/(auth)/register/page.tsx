import Link from "next/link";
import Image from "next/image";
import RegisterForm from "@/components/auth/RegisterForm";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Register | Our City Voice",
    description: "Create an account to participate in community actions.",
};

export default function RegisterPage() {
    return (
        <section className="w-full min-h-screen relative flex flex-col lg:flex-row bg-background text-foreground overflow-hidden">
            <div
                className="hidden lg:block lg:w-[56%] absolute left-0 top-0 bottom-0 h-full overflow-hidden"
                style={{
                    clipPath: "polygon(0 0, 85% 0, 100% 100%, 0% 100%)",
                }}
            >
                <Image
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    width={1470}
                    height={800}
                    alt="Community Development"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-tl from-black/80 via-black/30 to-black/10" />

                <div className="absolute bottom-12 left-12 right-32 text-white space-y-3 z-10">
                    <blockquote className="text-xl font-semibold leading-relaxed max-w-lg">
                        &ldquo;Join our growing community and help build a safer, cleaner, and smarter city.&rdquo;
                    </blockquote>
                    <p className="text-xs text-white/70 font-medium">
                        Be part of the positive change today.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-[44%] lg:ml-auto z-10 flex flex-col justify-between p-6 sm:p-10 lg:p-12 h-full min-h-screen bg-background">
                <div className="flex justify-start">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                </div>

                <div className="my-auto py-6 space-y-6 w-full max-w-md mx-auto">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl text-center font-extrabold tracking-tight text-foreground">
                            Create Account
                        </h1>
                        <p className="text-xs sm:text-sm text-center text-muted-foreground leading-relaxed">
                            Fill in your details below to join our platform <br /> and start engaging.
                        </p>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
                        <RegisterForm />
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-primary font-bold hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>

                <div className="text-[11px] text-muted-foreground/70 text-center lg:text-left">
                    &copy; {new Date().getFullYear()} Our City Voice. All rights reserved.
                </div>
            </div>
        </section>
    );
}