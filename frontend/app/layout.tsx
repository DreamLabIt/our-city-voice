import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/Footer";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

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
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />

        <main className="flex-1">
          {children}
          <Toaster position="top-right" richColors />
        </main>

        <Footer />
      </body>
    </html>
  );
}