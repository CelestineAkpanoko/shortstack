'use client'

import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { updateClass } from "@/src/app/actions/classActions"
import { useState } from "react"
import { EmojiPickerButton } from "@/src/components/ui/emoji-picker-button";

interface EditClassFormProps {
  isOpen: boolean
  onClose: () => void
  classData: {
    id: string
    name: string
    emoji: string
    cadence?: string
    day?: string
    time?: string
    grade?: string
  }
}

export function EditClassForm({ isOpen, onClose, classData }: EditClassFormProps) {
  const [formData, setFormData] = useState({
    name: classData.name,
    emoji: classData.emoji,
    cadence: classData.cadence || '',
    day: classData.day || '',
    time: classData.time || '',
    grade: classData.grade || '',
  })

  const handleUpdate = async () => {
    // Extract only valid fields to send to the server
    const validFormData = {
      name: formData.name,
      emoji: formData.emoji,
      cadence: formData.cadence,
      day: formData.day,
      time: formData.time,
      grade: formData.grade,
    };
    
    const result = await updateClass(classData.id, validFormData);
    if (result.success) {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Class</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name">Class Name</label>
            <Input
              id="name"
              placeholder="Class Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="emoji">Class Emoji</label>
            <EmojiPickerButton 
              value={formData.emoji}
              onChange={(emoji) => setFormData({ ...formData, emoji })}
              className="w-full text-2xl h-10"
            />
          </div>

          <div className="grid gap-2">
            <label>Cadence</label>
            <Select
              value={formData.cadence}
              onValueChange={(value) => setFormData({ ...formData, cadence: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label>Day</label>
            <Select
              value={formData.day}
              onValueChange={(value) => setFormData({ ...formData, day: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <SelectItem key={day.toLowerCase()} value={day.toLowerCase()}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="time">Time</label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
              <label htmlFor="grade">Grade</label>
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
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdate}>Update Class</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}