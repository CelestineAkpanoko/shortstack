import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MainLayoutLogo } from "@/src/components/MainLayoutLogo";
import "@/src/app/globals.css";
import { Toaster } from "@/src/components/ui/sonner";
import Providers from "@/src/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShortStack - Auth",
  description: "Financial education app",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header>
        <div className="max-w-7xl mx-auto p-auto flex items-center justify-between">
          <MainLayoutLogo />
          {/* Add any additional header content here */}
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}