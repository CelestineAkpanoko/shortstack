import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google"
import { MainLayoutLogo } from "@/src/components/MainLayoutLogo"
import "@/src/app/globals.css"
import { ClerkProvider } from '@clerk/nextjs';
import { checkUser } from '@/src/lib/checkUser'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] })

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  // // Ensure user is in database when app loads
  // await checkUser();



    <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className}`}>
        <div className="flex flex-col min-h-screen">
          <header>
            <div className="max-w-7xl mx-auto p-auto flex items-center justify-between">
              <MainLayoutLogo />
              {/* Add any additional header content here */}
            </div>
          </header>
          <main className={`${geistMono.variable}flex-grow max-w-7xl mx-auto px-4 py-2`}>
            {children}
          </main>
        </div>
      </body>
    </html>
    </ClerkProvider>
  );
}