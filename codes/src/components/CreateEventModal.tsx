import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
}

export const CreateEventModal = ({ isOpen, onClose, onSave }: CreateEventModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    gatheringName: "",
    gatheringType: "",
    gatheringDate: "",
    gatheringTime: "",
    description: "",
    parentId: ""
  });

  const handleSubmit = () => {
    if (!formData.gatheringName || !formData.gatheringType || !formData.gatheringDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });

    toast({
      title: "Event Created",
      description: `${formData.gatheringName} has been created successfully.`,
    });

    setFormData({
      gatheringName: "",
      gatheringType: "",
      gatheringDate: "",
      gatheringTime: "",
      description: "",
      parentId: ""
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event/Gathering</DialogTitle>
          <DialogDescription>
            Create a new event or gathering for attendance tracking.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="gatheringName">Event Name *</Label>
            <Input
              id="gatheringName"
              placeholder="e.g., Sunday Service, Youth Meeting"
              value={formData.gatheringName}
              onChange={(e) => setFormData({ ...formData, gatheringName: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="gatheringType">Event Type *</Label>
            <Select
              value={formData.gatheringType}
              onValueChange={(value) => setFormData({ ...formData, gatheringType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="GROUP">Group Meeting</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gatheringDate">Date *</Label>
              <Input
                id="gatheringDate"
                type="date"
                value={formData.gatheringDate}
                onChange={(e) => setFormData({ ...formData, gatheringDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="gatheringTime">Time</Label>
              <Input
                id="gatheringTime"
                type="time"
                value={formData.gatheringTime}
                onChange={(e) => setFormData({ ...formData, gatheringTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};