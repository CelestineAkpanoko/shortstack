import { getClasses } from "@/src/app/actions/classActions"
import { getRandomColorClass } from "@/src/lib/colorUtils"
import DashboardClient from "./DashboardClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/src/lib/auth/config"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/teacher');
  }
  
  // Ensure user is a teacher
  if (session.user.role !== "TEACHER") {
    redirect('/student/dashboard');
  }
  
  const response = await getClasses()
  
  if (!response.success || !response.data) {
    // Handle error case - you might want to show an error message
    return <div>Failed to load classes</div>
  }

  const classesWithColors = response.data.map((cls: { id: string }) => ({
    ...cls,
    colorClass: getRandomColorClass(cls.id)
  }))

  return <DashboardClient classes={classesWithColors} />
}
