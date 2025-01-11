"use client"

import * as React from "react"
import {
  Calendar,
  Home,
  Search,
  LogOut,
  NotebookPen, 
  CreditCard, 
  ReceiptText, 
  Store, 
  BookOpenCheck,
  Settings,
  ChevronLeft
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavLogo } from "@/components/nav-logo"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import mascot from '../../public/assets/img/Mascout 9ldpi.png'
import simple_logo from '../../public/assets/img/logo simple - greenldpi.png'

const data = {
  dashLogo: [{
         
    title: simple_logo,
    url: "/dashboard",
    icon: mascot,
  }
  ],
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: Home,
      isActive: true,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },  
    {
      title: "Classes",
      url: "#",
      icon: NotebookPen,
    },
    {
      title: "Calendar",
      url: "#",
      icon: Calendar,
    },
    {
      title: "Bank Accounts",
      url: "#",
      icon: CreditCard ,
    },
    {
      title: "Bills",
      url: "#",
      icon: ReceiptText,
    },
    {
      title: "Storefront",
      url: "#",
      icon: Store,
    },
    {
      title: "Lesson Plans",
      url: "#",
      icon: BookOpenCheck,
    },
    
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Log Out",
      url: "#",
      icon: LogOut,
    }
  ],
}

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="border-r-0" {...props}>
      <SidebarHeader className="items-center mb-4">
        <NavLogo items={data.dashLogo} />
      </SidebarHeader>
      <SidebarContent className="pl-4 pt-10 mb-4">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarContent className="pl-4 mb-4">
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
      <SidebarTrigger />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
