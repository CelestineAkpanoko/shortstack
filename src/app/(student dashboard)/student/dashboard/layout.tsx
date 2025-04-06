import { DashboardSidebar } from "@/src/components/students/StudentSidebarLeft"

export const metadata = {
  title: 'Student Dashboard - ShortStack',
  description: 'Financial education platform',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
}