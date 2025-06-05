"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/src/types/scheduler";
import { SchedulerProvider } from "@/src/providers/scheduler/schedular-provider";
import SchedulerViewFilteration from "@/src/components/scheduler/_components/view/schedular-view-filteration";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { TodoSidebar } from "@/src/components/todo-sidebar";
import { CheckSquare, X, ChevronLeft, ChevronRight } from "lucide-react";
import { HEADER_HEIGHT } from "@/src/lib/constants/header_height";
import { getUserTimeZone } from "@/src/lib/time-utils";

export default function TeacherCalendarClient() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTodoSidebar, setShowTodoSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  
  // Available height calculation (subtract header height)
  const contentHeight = `calc(100vh - ${HEADER_HEIGHT}px)`;

  // Check viewport size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // On mobile, default to hiding the sidebar
      if (window.innerWidth < 768) {
        setShowTodoSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch calendar events
  useEffect(() => {
    fetchEvents();
  }, []);

  // Close todo sidebar on mobile when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        isMobile &&
        showTodoSidebar && 
        !target.closest('.todo-sidebar') && 
        !target.closest('.toggle-todo-btn')
      ) {
        setShowTodoSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTodoSidebar, isMobile]);

  // Add custom styles for calendar layout and text truncation
  useEffect(() => {
    // Create a single style element for all calendar fixes
    const styleElement = document.createElement('style');
    styleElement.id = 'calendar-comprehensive-fixes';
    
    // Comprehensive styles that address all layout issues
    styleElement.textContent = `
      /* Base container fixes */
      .mina-scheduler-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        box-sizing: border-box !important;
      }
      
      /* Month view grid layout with proper cell distribution */
      .month-grid {
        display: grid !important;
        grid-template-columns: repeat(7, 1fr) !important;
        grid-template-rows: auto repeat(6, minmax(90px, 1fr)) !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: visible !important;
      }
      
      /* Month day cell sizing and positioning */
      .month-day-cell {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        min-height: 90px !important;
        height: auto !important;
        max-height: 160px !important;
        overflow: hidden !important;
        position: relative !important;
        box-sizing: border-box !important;
        padding: 4px !important;
      }
      
      /* Event item container constraints */
      .month-day-cell [data-event-item],
      .week-view-grid [data-event-item] {
        max-width: 100% !important;
        width: 100% !important;
        overflow: hidden !important;
        margin-bottom: 2px !important;
        box-sizing: border-box !important;
        position: relative !important;
      }
      
      /* All event content elements must respect container */
      .month-day-cell [data-event-item] *,
      .week-view-grid [data-event-item] * {
        max-width: 100% !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-sizing: border-box !important;
      }
      
      /* Target specific event content elements */
      .event-item-title,
      .event-title,
      .event-content,
      [data-event-item] .truncate,
      [data-event-item] [class*="title"],
      [data-event-item] h3,
      [data-event-item] h4,
      [data-event-item] p,
      [data-event-item] div {
        max-width: 100% !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: block !important;
        box-sizing: border-box !important;
      }
      
      /* Event containers */
      [class*="event-container"] {
        max-width: 100% !important;
        width: 100% !important;
        position: relative !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      
      /* Nested event elements */
      [class*="event-container"] > div,
      [class*="event-content"] > div,
      [class*="event-title"],
      [class*="event-text"] {
        max-width: 100% !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      
      /* Main scrollable areas */
      .calendar-panel {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        height: calc(100vh - 170px) !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      
      /* Main calendar container */
      .sticky-header-calendar {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        width: 100% !important;
        max-width: 100% !important;
      }

      /* Ensure background colors don't cause overflow */
      [style*="background-color"] {
        max-width: 100% !important;
        overflow: hidden !important;
      }
      
      /* Improved hover effect for event titles */
      .month-day-cell [data-event-item]:hover {
        position: relative !important;
        z-index: 50 !important;
      }
      
      .month-day-cell [data-event-item]:hover [class*="title"],
      .month-day-cell [data-event-item]:hover [class*="event-text"],
      .month-day-cell [data-event-item]:hover .truncate {
        position: absolute !important;
        background-color: inherit !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        white-space: normal !important;
        word-break: break-word !important;
        min-width: 100% !important;
        max-width: 250px !important;
        z-index: 51 !important;
      }
      
      /* Week view specific fixes */
      .week-view-grid {
        table-layout: fixed !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .week-view-grid td {
        position: relative !important;
        overflow: hidden !important;
        width: calc(100% / 7) !important;
        max-width: calc(100% / 7) !important;
        box-sizing: border-box !important;
      }
      
      .week-view-hour-cell {
        box-sizing: border-box !important;
        position: relative !important;
        overflow: hidden !important;
      }
      
      /* Fix day column headers */
      .mina-scheduler-column-header {
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      
      /* Mobile specific adjustments */
      @media (max-width: 640px) {
        .month-day-cell {
          min-height: 60px !important;
          padding: 2px !important;
        }
        
        .calendar-panel {
          height: calc(100vh - 150px) !important;
        }
        
        .month-day-cell [data-event-item] {
          font-size: 0.75rem !important;
        }
      }
    `;
    
    // Remove any existing style elements to avoid conflicts
    const existingStyle1 = document.getElementById('calendar-cell-fixes');
    if (existingStyle1) {
      document.head.removeChild(existingStyle1);
    }
    
    const existingStyle2 = document.getElementById('calendar-fix-styles');
    if (existingStyle2) {
      document.head.removeChild(existingStyle2);
    }
    
    const existingStyle3 = document.getElementById('calendar-comprehensive-fixes');
    if (existingStyle3) {
      document.head.removeChild(existingStyle3);
    }
    
    // Add the new comprehensive style element
    document.head.appendChild(styleElement);
    
    return () => {
      // Clean up
      const styleToRemove = document.getElementById('calendar-comprehensive-fixes');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, []);

  // Function to fetch events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const userTimeZone = getUserTimeZone();
      const response = await fetch("/api/calendar", {
        headers: {
          'Cache-Control': 'no-cache',
          'x-timezone': userTimeZone
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      
      const data = await response.json();
      
      // Process events with time zone adjustment
      const formatted = data.map((event: any) => {
        // For bills and assignments, we need special date handling
        if (event.metadata?.type === "bill" || event.metadata?.type === "assignment") {
          // Parse the date from the API response
          const date = new Date(event.startDate);
          
          // Create start date at midnight local time
          const startDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0, 0, 0
          );
          
          // Create end date at 11:59:59 PM local time
          const endDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            23, 59, 59
          );
      
          return {
            id: event.id,
            title: event.title,
            description: event.description || "",
            startDate: startDate,
            endDate: endDate,
            variant: event.variant || "primary",
            isRecurring: event.isRecurring === true,
            recurringDays: event.recurringDays || [],
            metadata: {
              ...event.metadata,
              isAllDay: true, // Mark as all-day event
              originalDueDate: event.metadata.dueDate // Preserve original
            },
          } as Event;
        } else {
          // For regular events, use the normal date processing
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          
          return {
            id: event.id,
            title: event.title,
            description: event.description || "",
            startDate: startDate,
            endDate: endDate,
            variant: event.variant || "primary",
            isRecurring: event.isRecurring === true,
            recurringDays: event.recurringDays || [],
            metadata: event.metadata,
          } as Event;
        }
      });

      setEvents(formatted);
    } catch (error) {
      console.error("Error fetching calendar:", error);
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }

  // Event handlers
  const handleAddEvent = async (event: Event) => {
    try {
      const eventData = {
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
      };

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error("Failed to create event");
      fetchEvents();
      toast.success("Event created successfully");
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to create event");
    }
  };

  const handleUpdateEvent = async (event: Event) => {
    try {
      const eventData = {
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
      };

      const response = await fetch(`/api/calendar/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error("Failed to update event");
      
      // Update the local state after successful API call
      setEvents(prevEvents => 
        prevEvents.map(e => e.id === event.id ? event : e)
      );
      
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  // Modify the handleDeleteEvent function to avoid double deletion
  const handleDeleteEvent = async (eventId: string) => {
    try {
      console.log("TeacherCalendarClient: Deleting event with ID:", eventId);
      
      // First, update local UI state for immediate feedback
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      
      // Then call the API to delete from the database
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: "DELETE",
      });
      
      // Check response and handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete event");
      }
      
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      
      // Show error toast
      toast.error("Failed to delete event");
      
      // If API call fails, refresh events to restore the UI state
      fetchEvents();
    }
  };

  const handleNavigateToItem = (event: Event) => {
    if (event.metadata?.type === "bill" && event.metadata.billId) {
      router.push(`/teacher/dashboard/bills/${event.metadata.billId}`);
    } else if (event.metadata?.type === "assignment" && event.metadata.assignmentId) {
      router.push(`/teacher/dashboard/assignments/${event.metadata.assignmentId}`);
    } else if (event.metadata?.type === "todo" && event.metadata.todoId) {
      router.push(`/teacher/dashboard/todos/${event.metadata.todoId}`);
    }
  };

  const toggleSidebar = () => {
    setShowTodoSidebar(!showTodoSidebar);
  };

  // Custom event modal component
  const TeacherEventModal = ({
    event,
    onClose,
  }: {
    event: Event;
    onClose: () => void;
  }) => {
    return (
      <div className="p-4 space-y-4 mb-4">
        <h2 className="text-lg font-semibold">{event.title || "Untitled Event"}</h2>

        {event.description && (
          <p className="text-sm text-gray-600">{event.description}</p>
        )}

        <div className="flex flex-col space-y-2 text-sm">
          <div className="flex items-center">
            <span className="font-medium mr-2">Start:</span>
            {event.startDate.toLocaleString()}
          </div>

          <div className="flex items-center">
            <span className="font-medium mr-2">End:</span>
            {event.endDate.toLocaleString()}
          </div>

          {event.isRecurring === true && (
            <div>
              <span className="font-medium mr-2">Recurring:</span>
              Yes
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          {(event.metadata?.type === "bill" || event.metadata?.type === "assignment") && (
            <Button onClick={() => handleNavigateToItem(event)}>
              View {event.metadata.type === "bill" ? "Bill" : "Assignment"}
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => {
              // Close the modal first
              onClose();
              // Then delete with the centralized function
              handleDeleteEvent(event.id);
            }}
          >
            Delete Event
          </Button>
        </div>
      </div>
    );
  };

  // Calculate the width of calendar vs sidebar based on sidebar visibility
  const calendarWidth = !isMobile && showTodoSidebar ? "calc(100% - 328px)" : "100%";
  const sidebarWidth = 340; // Fixed width for the sidebar
  
  return (
    <div className="h-full flex" style={{ height: contentHeight }}>
      {/* Main Calendar Content */}
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 bg-white"
        style={{ 
          width: calendarWidth, 
          maxWidth: calendarWidth
        }}
      >
        {/* Title container */}
        <div className="flex items-center justify-between">
          
          {/* Show toggle button only on mobile */}
          {isMobile && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSidebar}
              className="toggle-todo-btn mr-3"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Todos</span>
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex-1 flex justify-center items-center h-full">
            <div className="animate-spin h-6 w-6 border-3 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <SchedulerProvider
              initialState={events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            >
              <SchedulerViewFilteration
                views={{
                  views: ["month", "week", "day"],
                  mobileViews: ["month", "day"],
                  defaultView: "month",
                }}
                classNames={{
                  buttons: {
                    next: "bg-orange-500 text-white hover:bg-orange-600 text-xs sm:text-sm py-1 px-2 sm:px-3",
                    prev: "bg-orange-500 text-white hover:bg-orange-600 text-xs sm:text-sm py-1 px-2 sm:px-3",
                    addEvent: "bg-orange-500 text-white hover:bg-orange-600 text-xs sm:text-sm",
                  },
                  calendar: {
                    todayCell: "current-day",
                    container: "sticky-header-calendar h-full bg-white",
                  },
                  tabs: {
                    wrapper: "calendar-tabs-wrapper",
                    tabList: "calendar-tab-list flex bg-white border-b",
                    tab: "calendar-tab text-xs sm:text-sm px-3 py-2 whitespace-nowrap",
                    panel: "calendar-panel",
                  },
                }}
                CustomComponents={{
                  CustomEventModal: {
                    CustomViewEventModal: {
                      component: TeacherEventModal,
                    },
                  },
                }}
              />
            </SchedulerProvider>
          </div>
        )}
      </div>

      {/* Desktop Todo Sidebar with toggle */}
      {!isMobile && (
        <div 
          ref={sidebarContainerRef}
          className="relative" 
          style={{ minWidth: showTodoSidebar ? `${sidebarWidth}px` : "58px" }}
        >
          {/* When sidebar is open */}
          {showTodoSidebar && (
            <div 
              className="todo-sidebar bg-[#f1faf3] h-full relative overflow-auto"
              style={{ width: `${sidebarWidth}px`, height: contentHeight }}
            >
              {/* Apply full width to the TodoSidebar component */}
              <div className="w-full h-full">
                <TodoSidebar showCollapseButton={false} />
              </div>
              
              {/* Toggle button at bottom left when open */}
              <div 
                className="absolute bottom-4 left-4 cursor-pointer p-2 bg-[#e8f5eb] hover:bg-[#d3eedb] rounded-full shadow-sm z-10"
                onClick={toggleSidebar}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          )}
          
          {/* When sidebar is closed */}
          {!showTodoSidebar && (
            <div 
              className="bg-[#f1faf3] h-full flex flex-col items-center"
              style={{ width: "58px", height: contentHeight }}
            >
              {/* Spacer to push toggle to bottom */}
              <div className="flex-1"></div>
              
              {/* Toggle at bottom when closed */}
              <div 
                className="mb-4 ml-4 cursor-pointer p-2 bg-[#e8f5eb] hover:bg-[#d3eedb] rounded-full shadow-sm"
                onClick={toggleSidebar}
                style={{ alignSelf: 'flex-start' }}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Todo Sidebar - shows as overlay */}
      {isMobile && (
        <>
          <div 
            className={`todo-sidebar fixed inset-y-0 right-0 w-72 sm:w-80 bg-[#f1faf3] shadow-lg z-50 
                        transition-transform duration-300 ease-in-out
                        ${showTodoSidebar ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ top: `${HEADER_HEIGHT}px`, height: contentHeight }}
          >
            <div className="absolute right-3 top-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowTodoSidebar(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="pt-12 pb-4 px-4 border-b">
              <h2 className="text-lg font-semibold">Todo List</h2>
            </div>
            
            <div className="h-[calc(100%-72px)] overflow-auto">
              <TodoSidebar showCollapseButton={false} />
            </div>
          </div>
          
          {/* Overlay background when mobile sidebar is open */}
          {showTodoSidebar && (
            <div 
              className="fixed inset-0 bg-black/30 z-40"
              style={{ top: `${HEADER_HEIGHT}px` }}
              onClick={() => setShowTodoSidebar(false)}
            />
          )}
        </>
      )}
    </div>
  );
}