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

import { NavMain } from "@/src/components/nav-main"
import { NavLogo } from "@/src/components/nav-logo"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/src/components/ui/sidebar"

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
      url: "/teacher/dashboard",
      icon: Home,
    },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: Search,
    // },  
    {
      title: "Classes",
      url: "/teacher/dashboard/classes",
      icon: NotebookPen,
    },
    {
      title: "Calendar",
      url: "/teacher/dashboard/calendar",
      icon: Calendar,
    },
    {
      title: "Bank Accounts",
      url: "/teacher/dashboard/bank-accounts",
      icon: CreditCard ,
    },
    {
      title: "Bills",
      url: "/teacher/dashboard/bills",
      icon: ReceiptText,
    },
    {
      title: "Storefront",
      url: "/teacher/dashboard/storefront",
      icon: Store,
    },
    {
      title: "Lesson Plans",
      url: "/teacher/dashboard/lesson-plans",
      icon: BookOpenCheck,
    },
    
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
      <SidebarFooter>
      <SidebarTrigger />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
