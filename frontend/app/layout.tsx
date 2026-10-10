import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import ConditionalLayout from "@/components/common/ConditionalLayout";
import { getCurrentUser } from "@/lib/session";
import { getReportFilters, getReports } from "./actions/report";
import type { Report } from "@/types/report";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OurCityVoice - Empowering Citizens",
  description: "Report, share, and improve your city together.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const [PostsRes] = await Promise.all([
    getReports({ page: 1, limit: 100 }).catch(() => ({ posts: [] })),
    getReportFilters().catch(() => ({
      categories: [],
      wards: [],
      statuses: [],
      priorities: [],
    })),
  ]);

  const Reports: Report[] = PostsRes.posts || [];

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} min-h-screen`}>
        <ConditionalLayout user={user} Reports={Reports}>
          {children}
        </ConditionalLayout>

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}