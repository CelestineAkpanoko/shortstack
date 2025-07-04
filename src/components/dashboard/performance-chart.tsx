"use client";

import { useEffect, useState } from "react";
import { getTeacherClassesPerformance } from "@/src/app/actions/gradebookActions";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

const getColorForClass = (color: string) => {
  const colors: Record<string, string> = {
    primary: "#3b82f6", // blue
    secondary: "#ec4899", // pink
    destructive: "#f97316", // orange
    success: "#22c55e", // green
    warning: "#eab308", // yellow
  };
  return colors[color] || "#3b82f6";
};

interface ClassData {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  averageGrade: number;
  totalStudents: number;
  studentsWithGrades: number;
}

export function PerformanceChart() {
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const response = await getTeacherClassesPerformance();
      if (response.success && response.data) {
        setClassData(response.data.classes);
      } else {
        setError(response.error || "Failed to load performance data");
      }
    } catch (err) {
      setError("Error loading performance data");
      console.error("Performance data error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-2">
        <Card className="h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        </Card>
      </div>
    );
  }

  if (error || classData.length === 0) {
    return (
      <div className="w-full py-2">
        <Card className="h-[40vh] flex items-center justify-center text-center px-6">
          <div>
            <p className="text-gray-500 font-medium mb-2">
              No performance data
            </p>
            <p className="text-sm text-gray-400">
              {error ||
                "Add classes and assignments to view class performance."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const yAxisMarkers = [100, 80, 60, 40, 20, 0];

  return (
    <div className="w-full py-2">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Class Averages</h4>
      </div>

      <div className="relative h-64 overflow-x-auto">
        {/* Y-axis markers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400 py-1">
          {yAxisMarkers.map((val) => (
            <div key={val} className="flex items-center justify-end pr-2 h-4">
              <span>{val}%</span>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="pl-12 h-full">
          <div className="relative h-full w-max min-w-full">
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {yAxisMarkers.map((percent, index) => (
                <div
                  key={`grid-${percent}`}
                  className="absolute border-t border-gray-200 w-full"
                  style={{
                    top: `${(index / (yAxisMarkers.length - 1)) * 100}%`,
                  }}
                />
              ))}
            </div>

            <div className="relative h-full flex gap-6 items-end px-4">
                {classData.map((cls) => {
                  const classColor = getColorForClass(cls.color || "primary");
                  const barHeight = `${(cls.averageGrade / 100) * 200}px`;

                  return (
                    <TooltipProvider key={cls.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center w-16 group">
                            <div className="relative w-full h-[200px] flex items-end justify-center">
                              <div
                                className="w-10 rounded-t-md transition-all duration-300 shadow-sm"
                                style={{
                                  height: barHeight,
                                  backgroundColor: classColor,
                                  minHeight: cls.averageGrade > 0 ? "4px" : "0",
                                }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          <p className="text-sm font-semibold">
                            {cls.emoji} {cls.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cls.averageGrade}% average<br />
                            {cls.studentsWithGrades}/{cls.totalStudents} graded
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {classData.map((cls) => {
            const classColor = getColorForClass(cls.color || "primary");
            return (
              <div key={`legend-${cls.id}`} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: classColor }}
                />
                <span className="text-sm text-gray-700">
                  {cls.emoji} {cls.name} ({cls.averageGrade}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
