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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Calendar, UserCheck, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  id: number;
  event: string;
  date: string;
  role: string;
  volunteers: string[];
  needed: number;
  filled: number;
}

interface ManageAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignmentData: any) => void;
  assignment: Assignment | null;
}

export const ManageAssignmentModal = ({ isOpen, onClose, onSave, assignment }: ManageAssignmentModalProps) => {
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [message, setMessage] = useState("");

  // Mock available volunteers
  const availableVolunteers = [
    "John Smith", "Mary Johnson", "David Wilson", "Sarah Brown", 
    "Michael Davis", "Lisa Anderson", "Robert Taylor", "Emma Wilson"
  ];

  const handleSubmit = () => {
    if (!selectedAction) {
      toast({
        title: "No Action Selected",
        description: "Please select an action to perform.",
        variant: "destructive",
      });
      return;
    }

    const actionData = {
      assignmentId: assignment?.id,
      action: selectedAction,
      volunteer: selectedVolunteer,
      message: message,
      timestamp: new Date().toISOString(),
    };

    onSave(actionData);

    let actionDescription = "";
    switch (selectedAction) {
      case "reassign":
        actionDescription = `Assignment reassigned to ${selectedVolunteer}`;
        break;
      case "confirm":
        actionDescription = "Assignment marked as confirmed";
        break;
      case "cancel":
        actionDescription = "Assignment cancelled";
        break;
      case "communicate":
        actionDescription = "Message sent to volunteers";
        break;
      default:
        actionDescription = "Assignment updated";
    }

    toast({
      title: "Assignment Updated",
      description: actionDescription,
    });

    // Reset form
    setSelectedAction("");
    setSelectedVolunteer("");
    setMessage("");
    onClose();
  };

  if (!assignment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Volunteer Assignment</DialogTitle>
          <DialogDescription>
            Update assignment details and communicate with volunteers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Assignment Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{assignment.event}</span>
              <span className="text-muted-foreground">- {assignment.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{assignment.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Assigned:</span>
              <div className="flex flex-wrap gap-1">
                {assignment.volunteers.map((volunteer, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {volunteer}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={assignment.filled >= assignment.needed ? 'default' : 'destructive'}
                className={assignment.filled >= assignment.needed ? 'bg-green-100 text-green-800 border-green-200' : ''}
              >
                {assignment.filled}/{assignment.needed} filled
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div>
            <Label htmlFor="action">Select Action</Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reassign">Reassign Volunteer</SelectItem>
                <SelectItem value="confirm">Mark as Confirmed</SelectItem>
                <SelectItem value="cancel">Cancel Assignment</SelectItem>
                <SelectItem value="communicate">Send Message</SelectItem>
                <SelectItem value="add">Add More Volunteers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields */}
          {(selectedAction === "reassign" || selectedAction === "add") && (
            <div>
              <Label htmlFor="volunteer">Select Volunteer</Label>
              <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {availableVolunteers
                    .filter(vol => !assignment.volunteers.includes(vol))
                    .map((volunteer) => (
                      <SelectItem key={volunteer} value={volunteer}>
                        {volunteer}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedAction === "communicate" && (
            <div>
              <Label htmlFor="message">Message to Volunteers</Label>
              <Textarea
                id="message"
                placeholder="Type your message to the assigned volunteers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {selectedAction === "cancel" && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Warning: This will cancel the assignment and notify the volunteers.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedAction}>
            {selectedAction === "communicate" && <MessageSquare className="h-4 w-4 mr-2" />}
            Execute Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};