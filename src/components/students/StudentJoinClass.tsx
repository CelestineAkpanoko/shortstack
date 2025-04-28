"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { useToast } from "@/src/hooks/use-toast";

const formSchema = z.object({
  classCode: z
    .string()
    .min(6, {
      message: "Class code must be at least 6 characters.",
    })
    .max(10, {
      message: "Class code cannot be more than 10 characters.",
    }),
});

interface StudentJoinClassProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  onClassJoined?: (newClass: any) => void;
}

export function StudentJoinClass({ isOpen, onClose, onSuccess, onClassJoined }: StudentJoinClassProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    try {
      const response = await fetch("/api/student/join-class", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classCode: values.classCode }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "You have successfully joined the class!",
        });
        
        // Reset the form
        form.reset();
        
        // If the parent component provided an onClassJoined callback, call it with the new class data
        if (onClassJoined && data.class) {
          onClassJoined(data.class);
        }
        
        // Call onSuccess to close the dialog
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to join class",
        });
      }
    } catch (error: any) {
      console.error("Error joining class:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="classCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter class code" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Joining..." : "Join Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
