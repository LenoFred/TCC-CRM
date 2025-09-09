import { useState, useEffect } from "react";
import { Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface GroupMember {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Group {
  id: number;
  name: string;
  type: string;
  memberCount: number;
}

interface GroupAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

export const GroupAttendanceModal = ({ isOpen, onClose, group }: GroupAttendanceModalProps) => {
  const { toast } = useToast();
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [presentMembers, setPresentMembers] = useState<number[]>([]);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data - would be fetched from API based on group
  const mockGroupMembers: GroupMember[] = [
    { id: 1, name: "John Smith", email: "john@example.com", role: "Leader" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com" },
    { id: 3, name: "Michael Brown", email: "michael@example.com" },
    { id: 4, name: "Emily Davis", email: "emily@example.com", role: "Co-Leader" },
    { id: 5, name: "David Wilson", email: "david@example.com" },
    { id: 6, name: "Lisa Anderson", email: "lisa@example.com" },
    { id: 7, name: "James Taylor", email: "james@example.com" },
    { id: 8, name: "Maria Garcia", email: "maria@example.com" },
  ];

  useEffect(() => {
    if (isOpen && group) {
      setGroupMembers(mockGroupMembers);
      setPresentMembers([]);
      setMeetingDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, group]);

  const handleMemberToggle = (memberId: number, checked: boolean) => {
    if (checked) {
      setPresentMembers(prev => [...prev, memberId]);
    } else {
      setPresentMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSubmitAttendance = () => {
    if (presentMembers.length === 0) {
      toast({
        title: "No Attendance Recorded",
        description: "Please select at least one member as present.",
        variant: "destructive",
      });
      return;
    }

    // Submit attendance to API
    toast({
      title: "Attendance Recorded",
      description: `Attendance for ${presentMembers.length} members has been recorded for ${group?.name}.`,
    });

    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Take Attendance - {group.name}
          </DialogTitle>
          <DialogDescription>
            Mark attendance for group meeting on {new Date(meetingDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden space-y-4">
          {/* Meeting Date */}
          <div className="flex items-center gap-4">
            <label htmlFor="meetingDate" className="text-sm font-medium">
              Meeting Date:
            </label>
            <input
              id="meetingDate"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            />
          </div>

          {/* Attendance Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <span className="text-sm">
              <strong>{presentMembers.length}</strong> of <strong>{groupMembers.length}</strong> members present
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresentMembers(groupMembers.map(m => m.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresentMembers([])}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            <div className="p-4 space-y-3">
              {groupMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={presentMembers.includes(member.id)}
                    onCheckedChange={(checked) => 
                      handleMemberToggle(member.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`member-${member.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {member.name}
                      </label>
                      {member.role && (
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {presentMembers.includes(member.id) && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmitAttendance}>
            Submit Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};