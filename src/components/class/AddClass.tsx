"use client"


import { useState, useRef } from "react"

import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { createClass } from "@/src/app/actions/classActions"
import { toast } from "react-toastify"
import { EmojiPickerButton } from "@/src/components/ui/emoji-picker-button";

type AddClassProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
};

const AddClass = ({ isOpen, onClose, onSuccess }: AddClassProps) => {

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("📚")

  const clientAction = async (formData: FormData) => {
    try {
      console.log("Submitting class form data...");
      
      // Make sure emoji is included in form data
      formData.set('emoji', selectedEmoji);
      
      const result = await createClass(formData);
      console.log("Create class response:", result);

      if (!result.success) {
        toast.error(result.error || "Failed to create class");
      } else {
        toast.success(`Class created successfully! Class code: ${result.data.code}`);
        formRef.current?.reset();
        setSelectedEmoji("📚"); // Reset emoji
        onSuccess?.(); // This should trigger a refresh in the parent component
        onClose?.();
      }
    } catch (error) {
      console.error("Create class client error:", error);
      toast.error("Failed to create class");
    }
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={clientAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" name="name" placeholder="Class Name" required />
            </div>

            <div className="space-y-2">
              <Label>Class Emoji</Label>
              <input type="hidden" name="emoji" value={selectedEmoji} />
              <EmojiPickerButton 
                value={selectedEmoji}
                onChange={setSelectedEmoji}
                className="w-full text-2xl h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cadence">Cadence</Label>
              <Select name="cadence" defaultValue="Weekly">

                <SelectTrigger>
                  <SelectValue placeholder="Select cadence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Biweekly">Biweekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Select name="day" defaultValue="Monday">

                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>

                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <SelectItem key={day} value={day.toLowerCase()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input 
                id="time" 
                name="time" 
                type="time" 
                defaultValue="09:00" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select name="grade" defaultValue="9th">
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {["9th", "10th", "11th", "12th"].map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade} Grade
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Class
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddClass