"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";

interface AddAnythingProps {
  title: string;
  FormComponent: React.ComponentType<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; onClassJoined?: (newClass: any) => void }>;
  onItemAdded?: (newItem: any) => void;
}

const AddAnything: React.FC<AddAnythingProps> = ({ title, FormComponent, onItemAdded }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);
  
  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Card
        className="border-4 border-solid border-gray-400 w-[250px] h-[250px] rounded-xl bg-muted/80 flex flex-col justify-center items-center cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center w-full h-full pt-10">
          <div className="rounded-full bg-primary/35 p-2 text-primary/40 w-[80px] h-[80px] mx-2 my-2 hover:bg-primary/50 transition-colors duration-300">
            <Plus className="mx-2 my-2 w-12 h-12 object-center" />
          </div>
        </CardContent>
        <CardContent>
          <div className="items-center justify-center w-full h-full w-[130px] h-[20px] rounded-xl bg-primary/10 text-primary/60 px-7">
            {title}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <FormComponent
            isOpen={isOpen}
            onClose={handleClose}
            onSuccess={handleSuccess}
            onClassJoined={onItemAdded}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddAnything;
