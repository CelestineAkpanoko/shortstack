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
  CircleDollarSign,
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

interface StoreItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
  classes: Array<{  
    id: string;
    name: string;
    code: string;
    emoji: string;
  }>;
  purchases?: Array<{
    id: string;
    quantity: number;
    totalPrice: number;
    status: string;
    purchasedAt: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
  }>;
}

export default async function StoreItemPage({ params }: PageProps) {
  const { storeItemId } = await params;
  const response = await getStoreItem(storeItemId);
  if (!response.success || !response.data) {
    return notFound();
  }
  const storeItem = response.data;

  // Calculate purchase statistics with proper type safety
  const total = storeItem.quantity || 0;
  const purchased = storeItem.purchases?.reduce(
    (acc: any, purchase: { quantity: any; }) => acc + (purchase?.quantity || 0), 
    0
  ) || 0;
  
  const remaining = Math.max(total - purchased, 0);
  const percentPurchased = total > 0 ? Math.round((purchased / total) * 100) : 0;

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/teacher/dashboard/storefront"
            className="mr-2 flex items-center text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <span className="text-4xl mr-3">{storeItem.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{storeItem.name}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge 
              variant={storeItem.isAvailable ? "default" : "secondary"} 
              className="text-sm"
            >
              {storeItem.isAvailable ? "Available" : "Not Available"}
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <CircleDollarSign className="h-4 w-4 mr-1" />
                  <span>Price</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(storeItem.price)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <CircleDollarSign className="h-4 w-4 mr-1" />
                  <span>Amount Left</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-2xl font-bold">
                  {purchased}/{total}
                </p>
                <p className="text-xl font-bold text-gray-500">{percentPurchased}%</p>
              </div>
              <Progress value={percentPurchased} className="h-2 mt-2" />
              <div className="mt-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{purchased} purchased</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-600">
                    {remaining} left
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Tabs Area */}
        <Tabs defaultValue="details" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="classes">Classes </TabsTrigger>
            {/* <TabsTrigger value="purchase">Purchase History</TabsTrigger> */}
          </TabsList>

          {/* Description Tab */}
          <TabsContent value="description" className="mt-0">
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500">
                    {storeItem.description ||
                      "No description available for this item."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-0">
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                {Array.isArray(storeItem.classes) && storeItem.classes.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Assigned Classes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {storeItem.classes.map((classItem: {
                        id: string;
                        name: string;
                        code: string;
                        emoji: string;
                      }) => (
                        <Link 
                          href={`/teacher/dashboard/classes/${classItem.code}`} 
                          key={classItem.id}
                          className="flex items-center p-4 border rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-2xl mr-3">{classItem.emoji || '📚'}</span>
                          <div>
                            <p className="font-medium">{classItem.name}</p>
                            <p className="text-sm text-gray-500">Code: {classItem.code}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">This item is not assigned to any classes.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase History Tab */}
          <TabsContent value="purchase" className="mt-0">
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    Purchase History coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
