import { getClasses } from "@/src/app/actions/classActions"
import DashboardClient from "./DashboardClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/src/lib/auth/config"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/teacher');
  }
  
  // Ensure user is a teacher or SUPER
  if (session?.user?.role && !["TEACHER", "SUPER"].includes(session.user.role)) {
    redirect('/student/dashboard');
  }
  
  const response = await getClasses()
  
  if (!response.success || !response.data) {
    // Handle error case - you might want to show an error message
    return <div>Failed to load classes</div>
  }

  // No need to add random colors - use the color stored in the database
  // The ClassCard component already handles default values for missing colors
  return <DashboardClient classes={response.data} />
}
