import { getStoreItem } from "@/src/app/actions/storeFrontActions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { formatCurrency } from "@/src/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  AlertCircle,
  CalendarDays,
  Clock,
  CreditCard,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
  Receipt,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Progress } from "@/src/components/ui/progress";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

type PageProps = {
  params: Promise<{ storeItemId: string }>;
};

export default async function StoreItemPage({ params }: PageProps) {
    const { storeItemId } = await params;
    const response = await getStoreItem(storeItemId);
    if (!response.success || !response.data) {
        return notFound();
    }
    const storeItem = response.data;
    return (
        <main className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
                Welcome to my store item page! storeItemId: {storeItemId}
                </h1>
        </main>

    );
}
