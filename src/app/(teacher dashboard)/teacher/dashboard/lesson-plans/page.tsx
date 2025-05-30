"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  getGenericLessonPlans,
  getLessonPlans,
  deleteLessonPlan,
  createGenericLessonPlan,
  updateGenericLessonPlan,
  deleteGenericLessonPlan,
} from "@/src/app/actions/lessonPlansActions";
import LessonPlanCard from "@/src/components/lessonPlans/LessonPlanCard";
import AddLessonPlanDialog from "@/src/components/lessonPlans/AddLessonPlanDialog";
import AddGenericLessonPlanCard from "@/src/components/lessonPlans/AddGenericLessonPlanCard";
import GenericLessonPlanDialog from "@/src/components/lessonPlans/GenericLessonPlanDialog";
import AddAnything from "@/src/components/AddAnything";
import { toast } from "sonner";

// LessonPlan interface
interface LessonPlan {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LessonPlansPage() {
  const { data: session, status } = useSession();
  
  // Set default tab based on user role - templates for super users, my-plans for regular teachers
  const isSuperUser = session?.user?.role === "SUPER";
  const [activeTab, setActiveTab] = useState<"my-plans" | "templates">(
    isSuperUser ? "templates" : "my-plans"
  );
  const [userPlans, setUserPlans] = useState<LessonPlan[]>([]);
  const [genericPlans, setGenericPlans] = useState<LessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGenericDialogOpen, setIsGenericDialogOpen] = useState(false);
  const [selectedGenericPlan, setSelectedGenericPlan] =
    useState<LessonPlan | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Only fetch user-created lesson plans if not a super user
        if (session?.user?.id && !isSuperUser) {
          const userResponse = await getLessonPlans(session.user.id);
          if (userResponse.success) {
            setUserPlans(userResponse.data || []);
          }
        }

        // Always fetch generic lesson plans
        const genericResponse = await getGenericLessonPlans();
        if (genericResponse.success) {
          setGenericPlans(genericResponse.data || []);
        }
      } catch (error) {
        console.error("Error fetching lesson plans:", error);
        toast.error("Failed to load lesson plans");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [session, status, isSuperUser]);

  const handleCreateGenericPlan = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await createGenericLessonPlan(data);
      if (response.success) {
        toast.success("Template created successfully");
        // Add to the end of the array instead of the beginning
        setGenericPlans([...genericPlans, response.data]);
        setIsGenericDialogOpen(false);
      } else {
        toast.error(response.error || "Failed to create template");
      }
    } catch (error) {
      console.error("Error creating generic lesson plan:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleUpdateGenericPlan = async (
    id: string,
    data: { name: string; description?: string }
  ) => {
    try {
      const response = await updateGenericLessonPlan(id, data);
      if (response.success) {
        toast.success("Template updated successfully");
        setGenericPlans(
          genericPlans.map((plan) =>
            plan.id === id ? { ...plan, ...data } : plan
          )
        );
        setSelectedGenericPlan(null);
      } else {
        toast.error(response.error || "Failed to update template");
      }
    } catch (error) {
      console.error("Error updating generic lesson plan:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteGenericPlan = async (id: string) => {
    try {
      const response = await deleteGenericLessonPlan(id);
      if (response.success) {
        toast.success("Template deleted successfully");
        setGenericPlans(genericPlans.filter((plan) => plan.id !== id));
      } else {
        toast.error(response.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting generic lesson plan:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Add this function alongside your other handler functions
  const handleDeleteUserPlan = async (id: string) => {
    try {
      const response = await deleteLessonPlan(id);
      if (response.success) {
        toast.success("Lesson plan deleted successfully");
        // Update local state to remove the deleted plan
        setUserPlans(userPlans.filter((plan) => plan.id !== id));
      } else {
        toast.error(response.error || "Failed to delete lesson plan");
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0: return "bg-blue-100";
      case 1: return "bg-green-100";
      case 2: return "bg-yellow-100";
      default: return "bg-blue-100";
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="text-center py-8">Loading lesson plans...</div>;
  }

  return (
    <main className="container mx-auto p-4">
      {isSuperUser ? (
        // For super users, just show the templates content directly (no tabs)
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Render generic lesson plan cards */}
            {genericPlans.map((plan, index) => (
              <LessonPlanCard
                key={plan.id}
                plan={plan}
                backgroundColor={getColumnColor(index)}
                isTemplate={true}
                isSuperUser={true}
                onEdit={() => setSelectedGenericPlan(plan)}
                onDelete={() => handleDeleteGenericPlan(plan.id)}
              />
            ))}

            {/* Add Template card */}
            <AddGenericLessonPlanCard
              onClick={() => setIsGenericDialogOpen(true)}
            />

            {/* Show message if no templates exist yet */}
            {genericPlans.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No templates available. Create your first template using the card on the left.
              </div>
            )}
          </div>
        </div>
      ) : (
        // For regular teachers, show the tabs UI
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "my-plans" | "templates")
          }
        >
          <TabsList className="mb-6">
            <TabsTrigger value="my-plans">My Lesson Plans</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="my-plans">
            {/* Regular teachers' lesson plans content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {userPlans.length > 0 ? (
                userPlans.map((plan, index) => (
                  <LessonPlanCard
                    key={plan.id}
                    plan={plan}
                    backgroundColor={getColumnColor(index)}
                    isTemplate={false}
                    // Add these handlers
                    onDelete={() => handleDeleteUserPlan(plan.id)}
                    onUpdate={() => {
                      // Refresh user plans after deletion
                      if (session?.user?.id) {
                        getLessonPlans(session.user.id).then((response) => {
                          if (response.success) setUserPlans(response.data || []);
                        });
                      }
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  You haven't created any lesson plans yet.
                </div>
              )}

              <AddAnything title="Create Lesson Plan" FormComponent={AddLessonPlanDialog} />
            </div>
          </TabsContent>

          <TabsContent value="templates">
            {/* Templates content for regular teachers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {genericPlans.map((plan, index) => (
                <LessonPlanCard
                  key={plan.id}
                  plan={plan}
                  backgroundColor={getColumnColor(index)}
                  isTemplate={true}
                  isSuperUser={false}
                />
              ))}

              {genericPlans.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No templates available.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog for creating/editing regular lesson plans - only visible to regular teachers */}
      {!isSuperUser && (
        <AddLessonPlanDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={async () => {
            // Refresh data after creating a lesson plan
            if (session?.user?.id) {
              const response = await getLessonPlans(session.user.id);
              if (response.success) setUserPlans(response.data || []);
            }
          } } classCode={""}        />
      )}

      {/* Dialog for creating/editing generic lesson plans (templates) - only visible to super users */}
      {isSuperUser && (
        <GenericLessonPlanDialog
          isOpen={isGenericDialogOpen || !!selectedGenericPlan}
          onClose={() => {
            setIsGenericDialogOpen(false);
            setSelectedGenericPlan(null);
          }}
          onSubmit={
            selectedGenericPlan
              ? (data) => handleUpdateGenericPlan(selectedGenericPlan.id, data)
              : handleCreateGenericPlan
          }
          initialData={selectedGenericPlan || undefined}
        />
      )}
    </main>
  );
}
