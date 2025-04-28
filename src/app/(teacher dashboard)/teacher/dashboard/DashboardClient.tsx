"use client"
import SearchBar from "@/src/components/search-bar"
import Notification from "@/src/components/notification"
import { useSession, signOut } from "next-auth/react";
import { DefaultSession } from "next-auth";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/src/components/ui/button";
import { ClassCard } from "@/src/components/class/ClassCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import DashboardAddClassCard from "@/src/components/class/dashboard-add-class-card";
import UserDropdown from "./UserDropdown";

interface DashboardClientProps {
  classes: Array<{
    id: string
    name: string
    code: string
    emoji: string
    colorClass: string
    cadence?: string
    day?: string
    time?: string
    grade?: string
    backgroundColor: string
    numberOfStudents?: number
  }>
}
declare module "next-auth" {
  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    role: "TEACHER" | "STUDENT";
  }
}

const DashboardClient = ({ classes }: DashboardClientProps) => {


  const { data: session, status } = useSession({
    required: true,
    // onUnauthenticated() {
    //   redirect("/teacher");
    // },
  });


  // For debugging - add this inside your component (but not in render)
  useEffect(() => {
    if (session) {
      console.log(
        "Session data:",
        JSON.stringify(
          {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            name: session.user.name,
          },
          null,
          2
        )
      );
    }
  }, [session]);


   // Check for teacher role
  //  if (session?.user?.role !== "TEACHER") {
  //   redirect("/student/dashboard");
  // }

  // Get teacher info for avatar
  const teacherName =
    session?.user?.name ||
    `${session?.user?.firstName || ""} ${session?.user?.lastName || ""}`.trim() ||
    "Teacher";
  const teacherInitial = teacherName.charAt(0);
  const teacherImage = session?.user?.image;


  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/teacher" });
    // Optionally, you can clear any local state or perform other cleanup here  
    redirect("/teacher");
  };

  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0:
        return "bg-green-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-pink-500";
      default:
        return "bg-blue-500";
    }
  };
  return (
    <>
      <header className="flex h-10 shrink-0 items-center gap-2 bg-background">
        <div className="flex flex-1 items-center gap-2 px-3 rounded-half mx-auto bg-muted/50 pt-8 pl-8">
          <SearchBar />
          <Notification />
          <UserDropdown
            teacherImage={teacherImage || ""}
            teacherInitial={teacherInitial}
            teacherName={teacherName}
            onLogout={handleLogout}
          />
        </div>
      </header>
      <main className="flex flex-col p-4 h-[80vh]">
        <h1 className="text-2xl font-semibold my-4 py-4">Most Recent</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {classes.map((cls, index) => (
            <ClassCard
              key={cls.id}
              id={cls.id}
              emoji={cls.emoji}
              name={cls.name}
              code={cls.code}
              backgroundColor={getColumnColor(index)}
              cadence={cls.cadence}
              day={cls.day}
              time={cls.time}
              grade={cls.grade}
            />
          ))}
          {classes.length < 3 && <DashboardAddClassCard />}
        </div>
        <h1 className="text-2xl font-semibold py-4">Performance</h1>
        <div className="flex gap-4">
          <div className="h-[40vh] w-[60vw] rounded-xl bg-muted/50"></div>
        </div>
      </main>
    </>
  )
}

export default DashboardClient