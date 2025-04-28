"use client";
import { SidebarLeft } from "@/src/components/sidebar-left"
import { SidebarProvider, SidebarInset } from "@/src/components/ui/sidebar"
import { Toaster } from "@/src/components/ui/sonner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        {children}
        <Toaster />
      </SidebarInset>
      {/* <SidebarRight /> */}
    </SidebarProvider>
  )
}