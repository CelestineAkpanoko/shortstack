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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen ${geistSans.variable} ${geistMono.variable}`}>
      {/* Logo positioned absolutely in the top left */}
      <div className="absolute top-4 left-4 z-10">
        <MainLayoutLogo />
      </div>
      
      {/* Main content takes full height */}
      <main className="min-h-screen">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}