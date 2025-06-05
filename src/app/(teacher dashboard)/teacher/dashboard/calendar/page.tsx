import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import TeacherCalendarClient from "./TeacherCalendarClient";
import { Suspense } from "react";

export default function CalendarPage() {
  return (
    <SidebarProvider>
      {/* Add w-full and overflow-hidden classes */}
      <SidebarInset className="h-full w-full overflow-hidden">
        <div className="h-full w-full overflow-hidden">
          <Suspense fallback={
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin h-6 w-6 border-3 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
          }>
            <TeacherCalendarClient />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}