import {
  Calendar,
  Home,
  SquarePen,
  LogOut,
  Landmark, 
  ReceiptText, 
  ShoppingBag, 
  BookOpen,
} from "lucide-react";

import mascot from '../../../public/assets/img/Mascout 9ldpi.png';
import simple_logo from '../../../public/assets/img/logo-simple-greenldpi.png';

// Centralized navigation data for consistent use across components
export const dashboardData = {
  dashLogo: [{
    title: simple_logo,
    url: "/teacher/dashboard",
    icon: mascot,
  }],
  navMain: [
    {
      title: "Home",
      url: "/teacher/dashboard",
      icon: Home,
    },
    {
      title: "Classes",
      url: "/teacher/dashboard/classes",
      icon: SquarePen,
    },
    {
      title: "Calendar",
      url: "/teacher/dashboard/calendar",
      icon: Calendar,
    },
    {
      title: "Bank Accounts",
      url: "/teacher/dashboard/bank-accounts",
      icon: Landmark,
    },
    {
      title: "Bills",
      url: "/teacher/dashboard/bills",
      icon: ReceiptText,
    },
    {
      title: "Storefront",
      url: "/teacher/dashboard/storefront",
      icon: ShoppingBag,
    },
    {
      title: "Lesson Plans",
      url: "/teacher/dashboard/lesson-plans",
      icon: BookOpen,
    },
  ],
};

export const studentDashboardData = {
  dashLogo: [{
    title: simple_logo,
    url: "/student/dashboard",
    icon: mascot,
  }],
  navMain: [
    {
      title: "Home",
      url: "/student/dashboard",
      icon: Home,
    },
    {
      title: "Classes",
      url: "/student/dashboardclasses",
      icon: SquarePen,
    },
    {
      title: "Calendar",
      url: "/student/dashboardcalendar",
      icon: Calendar,
    },
    {
      title: "Bank Accounts",
      url: "/student/dashboardbank-accounts",
      icon: Landmark,
    },
    {
      title: "Storefront",
      url: "/teacher/dashboard/storefront",
      icon: ShoppingBag,
    },
  ],
};