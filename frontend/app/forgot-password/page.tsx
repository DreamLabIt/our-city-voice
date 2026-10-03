import Link from "next/link";
import Image from "next/image";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Forgot Password | Our City Voice",
    description: "Reset your password to regain access to your account.",
};

export default function ForgotPasswordPage() {
    return (
        <main className="w-full min-h-screen relative flex flex-col lg:flex-row bg-background text-foreground overflow-hidden">
            <div
                className="hidden lg:block lg:w-[56%] absolute left-0 top-0 bottom-0 h-full overflow-hidden"
                style={{
                    clipPath: "polygon(0 0, 85% 0, 100% 100%, 0% 100%)",
                }}
            >
                <Image
                    src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?fm=jpg&q=60&w=3000&auto=format&fit=crop"
                    width={1470}
                    height={800}
                    alt="Secure Access"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-tl from-black/80 via-black/30 to-black/10" />

                <div className="absolute bottom-12 left-12 right-32 text-white space-y-3 z-10">
                    <blockquote className="text-xl font-semibold leading-relaxed max-w-lg">
                        &ldquo;Security and privacy are at the core of our community portal.&rdquo;
                    </blockquote>
                    <p className="text-xs text-white/70 font-medium">
                        Reset your password quickly and get back to making an impact.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-[44%] lg:ml-auto z-10 flex flex-col justify-between p-6 sm:p-10 lg:p-12 h-full min-h-screen bg-background">
                <div className="flex justify-start">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Login</span>
                    </Link>
                </div>

                <div className="my-auto py-6 space-y-6 w-full max-w-md mx-auto">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl text-center font-extrabold tracking-tight text-foreground">
                            Forgot Password?
                        </h1>
                        <p className="text-xs sm:text-sm text-center text-muted-foreground leading-relaxed">
                            Enter your registered email address and we&apos;ll send you <br /> a link to reset your password.
                        </p>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
                        <ForgotPasswordForm />
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center">
                        Remembered your password?{" "}
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
        </main>
    );
}