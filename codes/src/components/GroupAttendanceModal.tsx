import { useState, useEffect } from "react";
import { Users, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TableBody } from "./ui/table";

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
  const [attendance, setAttendance] = useState<{
    date: string;
    presentCount: number;
    absentCount: number;
    members: { id: number; name: string; present: boolean; }[];
  }[]>([]);

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
      <DialogContent className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {group.name} - Attendance Management
          </DialogTitle>
          <DialogDescription>
            Track and manage attendance for group meetings and activities.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mark" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="history">View History</TabsTrigger>
          </TabsList>

          <TabsContent value="mark" className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-6 overflow-y-auto pr-2">
              {/* Attendance Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Present Today</h4>
                  <p className="text-2xl font-bold">{presentMembers.length}</p>
                  <p className="text-sm text-muted-foreground">of {groupMembers.length} members</p>
                </div>
                <div className="p-4 border rounded-lg space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Attendance Rate</h4>
                  <p className="text-2xl font-bold">
                    {Math.round((presentMembers.length / (groupMembers.length || 1)) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Today's meeting</p>
                </div>
                <div className="p-4 border rounded-lg space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Last Meeting</h4>
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-sm text-muted-foreground">Attendance rate</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-6 overflow-y-auto pr-2">
              {/* Attendance History */}
              <h3 className="text-lg font-semibold">Attendance History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceHistory.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.present ? "Yes" : "No"}</TableCell>
                      <TableCell>{entry.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};