"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ArrowLeft, AlertCircle, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/src/hooks/use-toast";
import { formatCurrency } from "@/src/lib/utils";
import Link from 'next/link';

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

export default function StudentStoreItemPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const storeItemId = Array.isArray(params.storeItemId) 
    ? params.storeItemId[0] 
    : params.storeItemId;

  useEffect(() => {
    const fetchStoreItem = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/student/storefront/${storeItemId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch store item');
        }
        
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error("Error fetching store item:", error);
        setError("Unable to load this item. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    if (storeItemId) {
      fetchStoreItem();
    }
  }, [storeItemId]);

  const handlePurchase = async () => {
    if (!item) return;
    
    setIsPurchasing(true);
    setPurchaseSuccess(false);
    
    try {
      const response = await fetch('/api/student/storefront/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId: item.id,
          quantity: 1
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to purchase item');
      }
      
      setPurchaseSuccess(true);
      toast({
        title: "Success!",
        description: "Item purchased successfully.",
      });
      
      // Reload the item to show updated quantity
      setTimeout(() => {
        router.refresh();
      }, 2000);
      
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Could not complete your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto p-4">
        <Link href="/student/dashboard/storefront" className="text-blue-600 hover:underline flex items-center mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Storefront
        </Link>
        
        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-6 flex flex-col items-center text-center p-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Item Not Found</h2>
            <p className="text-gray-600">{error || "This item doesn't exist or is no longer available."}</p>
            <Button className="mt-6" onClick={() => router.push('/student/dashboard/storefront')}>
              Return to Storefront
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/student/dashboard/storefront" className="text-blue-600 hover:underline flex items-center mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Storefront
      </Link>
      
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <span className="text-5xl mr-4">{item.emoji}</span>
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                  <p className="text-gray-500">From {item.class.map(c => c.name).join(", ")}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xl font-bold">
                {formatCurrency(item.price)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{item.description || "No description provided."}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Item Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Availability</p>
                    <p className="font-medium">
                      {item.isAvailable && item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity Remaining</p>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                </div>
              </div>
              
              {item.quantity < 5 && item.quantity > 0 && (
                <div className="flex items-center text-amber-600 text-sm border border-amber-200 bg-amber-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Only {item.quantity} left! Get yours before they're gone.
                </div>
              )}
              
              {item.quantity === 0 && (
                <div className="flex items-center text-red-600 text-sm border border-red-200 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  This item is currently out of stock.
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50 p-4">
            {purchaseSuccess ? (
              <div className="w-full flex items-center justify-center p-2 bg-green-100 text-green-700 rounded-md">
                <CheckCircle className="h-5 w-5 mr-2" />
                Purchase successful! Thank you for your order.
              </div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row gap-4">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => router.push('/student/dashboard/storefront')}
                >
                  Continue Shopping
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handlePurchase}
                  disabled={!item.isAvailable || item.quantity === 0 || isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Purchase ({formatCurrency(item.price)})
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}