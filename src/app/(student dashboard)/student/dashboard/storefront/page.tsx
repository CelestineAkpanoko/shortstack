"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { useToast } from "@/src/hooks/use-toast";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ShoppingBag, AlertCircle } from 'lucide-react';
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

export default function StudentStoreFrontPage() {
  const [loading, setLoading] = useState(true);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const fetchStoreItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/storefront');
      
      if (!response.ok) {
        throw new Error('Failed to fetch store items');
      }
      
      const data = await response.json();
      setStoreItems(data);
    } catch (error) {
      console.error("Error fetching store items:", error);
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
    try {
      const response = await fetch('/api/student/storefront/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity: 1 }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to purchase item');
      }
      
      toast({
        title: "Success!",
        description: "Item purchased successfully.",
      });
      
      // Refresh the items to update quantities
      fetchStoreItems();
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Could not complete your purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Storefront Items</h1>
        <p className="text-gray-500 mt-1">Items available for purchase from your classes</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          Loading store items...
        </div>
      ) : storeItems.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No items available</h3>
          <p className="mt-2 text-gray-500">
            There are no items available for purchase from your classes right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{item.emoji}</span>
                    <CardTitle>{item.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{formatCurrency(item.price)}</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {item.description && (
                  <p className="text-gray-600 mb-4">{item.description}</p>
                )}
                
                <div className="mt-2 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.class.map((cls) => (
                      <Badge key={cls.id} variant="outline" className="flex items-center">
                        <span className="mr-1">{cls.emoji}</span> {cls.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {item.quantity < 5 && (
                  <div className="flex items-center mt-3 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Only {item.quantity} left!
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => handlePurchase(item.id)}
                  disabled={item.quantity === 0}
                >
                  Purchase
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}