import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export const metadata = {
    title: "Login | Civic Portal",
    description: "Sign in to access your account dashboard.",
};

/**
 * `next` is read here rather than with useSearchParams inside LoginForm.
 *
 * useSearchParams in a client component forces the page to be either dynamic or
 * wrapped in Suspense, and Next fails the build if it is neither. Reading it in
 * the server component and passing it down avoids both.
 */
export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const { next } = await searchParams;

    return (
        <section className="w-full min-h-screen relative flex flex-col lg:flex-row bg-background text-foreground overflow-hidden">
            <div className="w-full lg:w-[20%] xl:w-[44%] z-10 flex flex-col justify-center p-6 sm:p-10 lg:p-12 h-full min-h-screen bg-background">
                <div>
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
                            Sign In
                        </h1>
                        <p className="text-xs sm:text-sm text-center text-muted-foreground leading-relaxed">
                            Manage your reports, track issues, and engage <br /> with your community.
                        </p>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
                        <LoginForm next={next} />
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center sm:text-left">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="text-primary font-bold hover:underline"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>

                <div className="text-[11px] text-muted-foreground/70">
                    &copy; {new Date().getFullYear()} Our City Voice. All rights reserved.
                </div>
            </div>

            <div
                className="hidden lg:block lg:w-[56%] absolute right-0 top-0 bottom-0 h-full overflow-hidden"
                style={{
                    clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)",
                }}
            >
                <Image
                    src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?fm=jpg&q=60&w=3000&auto=format&fit=crop"
                    width={1470}
                    height={800}
                    alt="Cityscape"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-black/80 via-black/30 to-black/10" />

                <div className="absolute bottom-12 right-12 left-32 text-white space-y-3 z-10">
                    <blockquote className="text-xl font-semibold leading-relaxed max-w-lg">
                        &ldquo;Building a cleaner, safer, and better city together through real-time community action.&rdquo;
                    </blockquote>
                    <p className="text-xs text-white/70 font-medium">
                        Join thousands of active citizens making an impact every day.
                    </p>
                </div>
            </div>
        </section>
    );
}
