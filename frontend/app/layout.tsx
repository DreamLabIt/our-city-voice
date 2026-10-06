import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import ConditionalLayout from "@/components/common/ConditionalLayout";
import { getCurrentUser } from "@/lib/session";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OurCityVoice - Empowering Citizens",
  description: "Report, share, and improve your city together.",
};

/**
 * Reads the session so the navbar can show an avatar instead of a Login button.
 *
 * The cost is that touching cookies here opts every page out of static
 * rendering. Worth it: the alternative is fetching the account from the browser
 * after hydration, which means every page flashes "Login" at somebody who is
 * already signed in.
 *
 * It is not a request to the API for anonymous visitors. getCurrentUser returns
 * null without a round trip when there is no access cookie, so only signed-in
 * readers pay for it.
 */
export default async function RootLayout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} min-h-screen`}>
        <ConditionalLayout user={user}>
          {children}
        </ConditionalLayout>

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}