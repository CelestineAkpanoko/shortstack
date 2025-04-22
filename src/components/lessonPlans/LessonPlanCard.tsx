import Link from 'next/link';
import { Card, CardContent } from "../ui/card";

interface LessonPlanCardProps {
  plan: any;
  classCode: string;
}

export default function LessonPlanCard({ plan, classCode }: LessonPlanCardProps) {
  return (
    <Link href={`/dashboard/classes/${classCode}/lesson-plans/${plan.id}`}>
      <Card className="bg-orange-400 w-[250px] h-[250px] rounded-xl relative cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center justify-center h-full">
          <h1 className="text-2xl font-bold">{plan.name}</h1>
        </CardContent>
      </Card>
    </Link>
  );
}
