"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useToast } from "@/src/hooks/use-toast";
import {
  Menu,
  X,
  ShoppingBag ,
  Home,
  SquarePen,
  Calendar,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import images
import mascot from "@/public/assets/img/Mascout 9ldpi.png";
import simpleLogo from "@/public/assets/img/logo simple - greenldpi.png";

export function DashboardSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const navItems = [
    { href: "/student/dashboard", icon: Home, label: "Dashboard" },
    { href: "/student/dashboard/classes", icon: SquarePen, label: "Classes" },
    { href: "/student/dashboard/calendar", icon: Calendar, label: "Calendar" },
    { href: "/student/dashboard/bank", icon: Wallet, label: "Bank" },
    { href: "/student/dashboard/storefront", icon: ShoppingBag , label: "Storefront" },
  ];
  
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/student');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* MOBILE HEADER (sticky) */}
      <header className="md:hidden sticky top-0 z-10 bg-white p-2 border-b flex items-center justify-between">
        {/* Left: Mascot + Logo */}
        <div className="flex items-center gap-2">
          <Image src={mascot} alt="Mascot" width={32} height={32} />
          <Image src={simpleLogo} alt="ShortStacks" width={80} height={20} />
        </div>
        {/* Right: Hamburger Icon */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#f1faf3] z-50 transform transition-transform duration-300
          md:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#f1faf3]">
          <div className="flex items-center">
            <Image src={mascot} alt="Mascot" width={32} height={32} />
            <Image src={simpleLogo} alt="ShortStacks" width={120} height={32} />
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className="block px-4 py-2 hover:bg-white/50"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5" />
                <span className="text-sm md:text-base">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Drawer Logout */}
        <div className="mt-2">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-white/50"
          >
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              <span className="text-sm md:text-base">Logout</span>
            </div>
          </button>
        </div>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex md:flex-col bg-[#f1faf3] transition-all duration-300
          ${isCollapsed ? "md:w-16" : "md:w-64"}
        `}
      >
        {/* Logo Row */}
        <div className="p-4 flex items-center">
          <Image src={mascot} alt="Mascot" width={32} height={32} />
          {!isCollapsed && (
            <Image
              src={simpleLogo}
              alt="ShortStacks"
              width={80}
              height={20}
              className="ml-2"
            />
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 hover:bg-white/50"
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && (
                <span className="text-sm md:text-base">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/50"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && (
              <span className="text-sm md:text-base">Logout</span>
            )}
          </button>
        </div>

        {/* Chevron Toggle at bottom-right */}
        <div className="px-2 pb-4 flex justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}