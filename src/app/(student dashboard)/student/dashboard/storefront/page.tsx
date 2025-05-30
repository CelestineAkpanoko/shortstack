"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/src/components/ui/card";
import { useToast } from "@/src/hooks/use-toast";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { ShoppingBag, AlertCircle, DollarSign, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils";

interface StoreItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
  class: {
    id: string;
    name: string;
    emoji: string;
  }[];
}

interface InsufficientFundsData {
  itemName: string;
  itemPrice: number;
  currentBalance: number;
  needed: number;
}

export default function StudentStoreFrontPage() {
  const [loading, setLoading] = useState(true);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [insufficientFunds, setInsufficientFunds] =
    useState<InsufficientFundsData | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    itemName: string;
    itemEmoji: string;
    newBalance: number;
  } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchStoreItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/storefront");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error response:", errorText);
        throw new Error(`Failed to fetch store items: ${response.status}`);
      }

      const data = await response.json();
      setStoreItems(data);
    } catch (error) {
      console.error("❌ Client error fetching store items:", error);
      toast({
        title: "Error",
        description: "Failed to load store items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreItems();
  }, [router, toast]);

  const handlePurchase = async (itemId: string) => {
    const item = storeItems.find((i) => i.id === itemId);
    if (!item) return;

    setPurchasing(itemId);

    try {
      const response = await fetch("/api/student/storefront/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity: 1 }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if it's an insufficient funds error
        if (
          result.error === "Insufficient balance to purchase this item" &&
          result.details
        ) {
          setInsufficientFunds({
            itemName: item.name,
            itemPrice: item.price,
            currentBalance: result.details.currentBalance,
            needed: result.details.needed,
          });
          return;
        }

        throw new Error(result.error || "Failed to purchase item");
      }

      // SUCCESS: Show both toast and success state
      console.log("✅ Purchase successful");

      // Set success state for dialog
      setPurchaseSuccess({
        itemName: item.name,
        itemEmoji: item.emoji,
        newBalance: result.newBalance,
      });

      // Also try the toast
      toast({
        title: "Purchase Successful! 🎉",
        description: `${item.emoji} ${item.name} purchased successfully!`,
        duration: 4000,
      });

      // Refresh items after a delay
      setTimeout(() => {
        fetchStoreItems();
      }, 1000);
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Purchase Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not complete your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Storefront Items</h1>
          <p className="text-gray-500 mt-1">
            Items available for purchase from your classes
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading store items...</span>
          </div>
        ) : storeItems.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No items available
            </h3>
            <p className="mt-2 text-gray-500">
              There are no items available for purchase from your classes right
              now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {storeItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-[250px]"
              >
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{item.emoji}</span>
                      <CardTitle className="text-lg leading-tight">
                        {item.name}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {formatCurrency(item.price)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow flex flex-col justify-between py-2">
                  <div className="flex-grow">
                    {item.description && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Fixed height container for the quantity warning */}
                  <div className="h-6 flex items-center">
                    {item.quantity < 5 && item.quantity > 0 && (
                      <div className="flex items-center text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>Only {item.quantity} left!</span>
                      </div>
                    )}
                    {item.quantity === 0 && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>Out of stock</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 pb-4 flex-shrink-0">
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(item.id)}
                    disabled={item.quantity === 0 || purchasing === item.id}
                    variant={item.quantity === 0 ? "secondary" : "default"}
                  >
                    {purchasing === item.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : item.quantity === 0 ? (
                      "Out of Stock"
                    ) : (
                      "Purchase"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Insufficient Funds Alert Dialog */}
      <AlertDialog
        open={!!insufficientFunds}
        onOpenChange={() => setInsufficientFunds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <DollarSign className="h-5 w-5 text-red-500 mr-2" />
              Insufficient Funds
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You don't have enough money in your checking account to
                  purchase{" "}
                  <span className="font-medium">
                    {insufficientFunds?.itemName}
                  </span>
                  .
                </p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Item cost:</span>
                    <span className="font-medium">
                      {formatCurrency(insufficientFunds?.itemPrice || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your balance:</span>
                    <span className="font-medium">
                      {formatCurrency(insufficientFunds?.currentBalance || 0)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-red-600">
                    <span>Amount needed:</span>
                    <span className="font-bold">
                      {formatCurrency(insufficientFunds?.needed || 0)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Complete assignments or participate in class activities to
                  earn more money.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setInsufficientFunds(null)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Purchase Dialog */}
      <AlertDialog
        open={!!purchaseSuccess}
        onOpenChange={() => setPurchaseSuccess(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Purchase Successful!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-center">
                <div className="text-4xl">{purchaseSuccess?.itemEmoji}</div>
                <p className="text-lg font-medium">
                  {purchaseSuccess?.itemName} purchased successfully!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setPurchaseSuccess(null)}
              className="bg-stone-950 hover:bg-gray-600"
            >
              Great!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
