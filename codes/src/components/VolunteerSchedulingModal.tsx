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
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VolunteerSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: any) => void;
}

export const VolunteerSchedulingModal = ({ isOpen, onClose, onSave }: VolunteerSchedulingModalProps) => {
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [roleSlots, setRoleSlots] = useState<{ roleId: string; roleName: string; count: number }[]>([]);

  // Mock data
  const events = [
    { id: "1", name: "Sunday Service", date: "2024-09-01" },
    { id: "2", name: "Youth Fellowship", date: "2024-09-01" },
    { id: "3", name: "Easter Service", date: "2024-09-08" },
    { id: "4", name: "Christmas Service", date: "2024-12-25" }
  ];

  const volunteerRoles = [
    { id: "1", name: "Usher" },
    { id: "2", name: "Greeter" },
    { id: "3", name: "Sound Tech" },
    { id: "4", name: "Worship Team" },
    { id: "5", name: "Children's Ministry" }
  ];

  const addRoleSlot = (roleId: string, roleName: string) => {
    if (roleSlots.find(slot => slot.roleId === roleId)) {
      toast({
        title: "Role Already Added",
        description: "This role has already been added to the schedule.",
        variant: "destructive",
      });
      return;
    }

    setRoleSlots([...roleSlots, { roleId, roleName, count: 1 }]);
  };

  const updateRoleCount = (roleId: string, count: number) => {
    if (count < 1) return;
    setRoleSlots(roleSlots.map(slot => 
      slot.roleId === roleId ? { ...slot, count } : slot
    ));
  };

  const removeRoleSlot = (roleId: string) => {
    setRoleSlots(roleSlots.filter(slot => slot.roleId !== roleId));
  };

  const handleSubmit = () => {
    if (!selectedEvent) {
      toast({
        title: "Validation Error",
        description: "Please select an event.",
        variant: "destructive",
      });
      return;
    }

    if (roleSlots.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one volunteer role.",
        variant: "destructive",
      });
      return;
    }

    const scheduleData = {
      eventId: selectedEvent,
      event: events.find(e => e.id === selectedEvent),
      roles: roleSlots,
      createdAt: new Date().toISOString(),
    };

    onSave(scheduleData);

    toast({
      title: "Schedule Created",
      description: "Volunteer schedule has been created successfully.",
    });

    // Reset form
    setSelectedEvent("");
    setRoleSlots([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Volunteer Schedule</DialogTitle>
          <DialogDescription>
            Select an event and define the volunteer roles needed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Selection */}
          <div>
            <Label htmlFor="event">Select Event *</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {event.date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Volunteer Roles */}
          <div>
            <Label>Add Volunteer Roles</Label>
            <div className="flex gap-2 mt-2">
              <Select onValueChange={(value) => {
                const role = volunteerRoles.find(r => r.id === value);
                if (role) {
                  addRoleSlot(role.id, role.name);
                }
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a volunteer role" />
                </SelectTrigger>
                <SelectContent>
                  {volunteerRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role Slots */}
          {roleSlots.length > 0 && (
            <div>
              <Label>Volunteer Requirements</Label>
              <div className="space-y-3 mt-2">
                {roleSlots.map((slot) => (
                  <div key={slot.roleId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{slot.roleName}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {slot.count} volunteer{slot.count !== 1 ? 's' : ''} needed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRoleCount(slot.roleId, slot.count - 1)}
                        disabled={slot.count <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={slot.count}
                        onChange={(e) => updateRoleCount(slot.roleId, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRoleCount(slot.roleId, slot.count + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRoleSlot(slot.roleId)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};