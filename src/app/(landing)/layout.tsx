"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { Menu, X } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="bg-green-600 text-white py-4 top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo and tagline */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/assets/img/Mascout 9ldpi.png"
                alt="ShortStacks Mascot"
                width={40}
                height={40}
                className="mr-2"
              />
              <div>
                <h1 className="text-2xl font-bold">ShortStacks</h1>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-green-200">Home</Link>
            <Link href="/about" className="hover:text-green-200">About</Link>
            <Link href="/pricing" className="hover:text-green-200">Pricing</Link>
            <Link href="/user-role?action=signup">
              <Button className="bg-green-600 border hover:bg-green-800 px-6 py-2 rounded-md">
                Sign Up
              </Button>
            </Link>
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md text-white" 
            onClick={toggleMobileMenu}
          >
            <span className="sr-only">Open menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 px-4">
            <div className="flex flex-col space-y-3 bg-green-700 rounded-md p-4">
              <Link href="/" className="py-2 hover:text-green-200">Home</Link>
              <Link href="/about" className="py-2 hover:text-green-200">About</Link>
              <Link href="/pricing" className="py-2 hover:text-green-200">Pricing</Link>
              <Link href="/user-role?action=signin">
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-green-800 w-full py-2 rounded-md">
                  Sign In
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" className="w-full border-yellow-400 text-yellow-400 hover:bg-green-700 py-2 rounded-md">
                  Request a Demo
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>
      
      {/* Page content */}
      {children}
      <SpeedInsights/>
      {/* Footer */}

      <div className="relative">

            <svg className="w-full h-28 text-green-600" viewBox="0 0 1200 140" preserveAspectRatio="none">
              <path d="M0,0 C200,100 400,100 600,40 C800,0 1000,0 1200,0 L1200,140 L0,140 Z" fill="currentColor" />
            </svg>

              
              <footer className="bg-green-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image 
                  src="/assets/img/Mascout 9ldpi.png"
                  alt="ShortStacks Mascot"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <h2 className="text-xl font-bold">ShortStacks</h2>
              </div>
              <p className="text-sm">One Virtual Dollar at a Time</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <p className="text-sm">info@shortstacksffk.com</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:underline">Home</Link></li>
                <li><Link href="/about" className="hover:underline">About</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Social Media</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:underline">Twitter</Link></li>
                <li><Link href="#" className="hover:underline">LinkedIn</Link></li>
                <li><Link href="#" className="hover:underline">Facebook</Link></li>
                <li><Link href="#" className="hover:underline">Instagram</Link></li>
                <li><Link href="#" className="hover:underline">YouTube</Link></li>
                <li><Link href="#" className="hover:underline">TikTok</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center pt-2 border-t border-green-500">
            <p className="text-sm">&copy; {new Date().getFullYear()} ShortStacks Finance For Kids. All rights reserved.</p>
          </div>
        </div>
      </footer>


    </div>


            </div>


      
  );
}