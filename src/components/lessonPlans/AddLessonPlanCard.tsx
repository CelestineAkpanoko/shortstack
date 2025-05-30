"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Plus } from "lucide-react";

interface AddLessonPlanCardProps {
  onClick: () => void;
}

export default function AddLessonPlanCard({ onClick }: AddLessonPlanCardProps) {
  return (
    <Card
      className="border-4 border-solid border-gray-400 w-[250px] h-[250px] rounded-xl bg-muted/80 flex flex-col justify-center items-center cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center w-full h-full pt-10">
        <div className="rounded-full bg-primary/35 p-2 text-primary/40 w-[80px] h-[80px] mx-2 my-2 hover:bg-primary/50 transition-colors duration-300">
          <Plus className="mx-2 my-2 w-12 h-12 object-center" />
        </div>
      </CardContent>
      <CardContent>
        <div className="items-center justify-center w-full h-full w-[130px] h-[20px] rounded-xl bg-primary/10 text-primary/60 px-7">
          Add Lesson Plan
        </div>
      </CardContent>
    </Card>
  );
}
