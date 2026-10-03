import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import ConditionalLayout from "@/components/common/ConditionalLayout";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OurCityVoice - Empowering Citizens",
  description: "Report, share, and improve your city together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} min-h-screen`}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}