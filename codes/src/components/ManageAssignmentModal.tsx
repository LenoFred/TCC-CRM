import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/config/api";
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
  assignmentID?: string;
  memberID?: string;
  memberName?: string;
  groupID?: string;
  groupName?: string;
  groupType?: string;
  roleID?: string;
  roleName?: string;
  assignmentStatus?: string;
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
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.members.getAll();
      const membersData = response?.data || response || [];
      console.log('All members:', membersData);
      // Filter for active members only
      const activeMembers = membersData.filter((m: any) => {
        const isActive = m.status?.toLowerCase() === 'active';
        console.log(`Member ${m.memberID}: status=${m.status}, isActive=${isActive}`);
        return isActive;
      });
      console.log('Active members count:', activeMembers.length);
      setMembers(activeMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVolunteer = (memberID: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(memberID)
        ? prev.filter(id => id !== memberID)
        : [...prev, memberID]
    );
  };

  const removeVolunteer = (memberID: string) => {
    setSelectedVolunteers(prev => prev.filter(id => id !== memberID));
  };

  const handleSubmit = async () => {
    if (!selectedAction) {
      toast({
        title: "No Action Selected",
        description: "Please select an action to perform.",
        variant: "destructive",
      });
      return;
    }

    if ((selectedAction === 'reassign' || selectedAction === 'add') && selectedVolunteers.length === 0) {
      toast({
        title: "No Volunteers Selected",
        description: "Please select at least one volunteer.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Handle adding more volunteers
      if (selectedAction === 'add') {
        const assignmentPromises = selectedVolunteers.map(memberID => 
          api.volunteers.createAssignment({
            memberID,
            groupID: assignment?.groupID || '',
            roleID: assignment?.roleID || '',
            assignmentStatus: 'Scheduled',
          })
        );
        await Promise.all(assignmentPromises);
      }

      const actionData = {
        assignmentID: assignment?.assignmentID,
        groupID: assignment?.groupID,
        roleID: assignment?.roleID,
        action: selectedAction,
        volunteers: selectedVolunteers,
        message: message,
        timestamp: new Date().toISOString(),
      };

      onSave(actionData);
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: "Failed to execute action. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let actionDescription = "";
    switch (selectedAction) {
      case "reassign":
        actionDescription = `Assignment reassigned to ${selectedVolunteers.length} volunteer(s)`;
        break;
      case "add":
        actionDescription = `${selectedVolunteers.length} volunteer(s) added to assignment`;
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
    setSelectedVolunteers([]);
    setMessage("");
    setIsLoading(false);
    onClose();
  };

  if (!assignment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
              <span className="font-medium">{assignment.groupName || 'N/A'}</span>
              {assignment.groupType && (
                <span className="text-muted-foreground">- {assignment.groupType}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{assignment.roleName || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Assigned:</span>
              <Badge variant="outline" className="text-xs">
                {assignment.memberName || 'Unassigned'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={assignment.assignmentStatus === 'Completed' ? 'default' : 'secondary'}
                className={assignment.assignmentStatus === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
              >
                {assignment.assignmentStatus || 'Pending'}
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
              <Label htmlFor="volunteer">
                {selectedAction === "add" ? "Add More Volunteers" : "Reassign to Volunteer(s)"}
              </Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Loading members...
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No active members available
                  </div>
                ) : (
                  members.map((member: any) => (
                    <div 
                      key={member.memberID} 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => toggleVolunteer(member.memberID)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.includes(member.memberID)}
                        onChange={() => toggleVolunteer(member.memberID)}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <label className="flex-1 cursor-pointer text-sm">
                        {member.firstName} {member.lastName}
                        {member.phoneNumber && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({member.phoneNumber})
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedVolunteers.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {selectedVolunteers.length} volunteer(s) selected
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVolunteers.map((memberID) => {
                      const member = members.find((m: any) => m.memberID === memberID);
                      return (
                        <Badge 
                          key={memberID} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {member?.firstName} {member?.lastName}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVolunteer(memberID);
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
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
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedAction || isLoading}>
            {selectedAction === "communicate" && <MessageSquare className="h-4 w-4 mr-2" />}
            {isLoading ? "Processing..." : "Execute Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};