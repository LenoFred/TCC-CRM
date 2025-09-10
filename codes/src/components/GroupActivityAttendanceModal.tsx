import { useState, useEffect } from "react";
import { X, Users, Search, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface Activity {
  id: number;
  name: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  status: 'Planned' | 'Completed' | 'Cancelled';
  attendanceCount?: number;
}

interface Member {
  id: number;
  name: string;
  checkInTime: string;
}

interface GroupActivityAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  activity: Activity | null;
}

export const GroupActivityAttendanceModal = ({ 
  isOpen, 
  onClose, 
  group,
  activity 
}: GroupActivityAttendanceModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [attendees, setAttendees] = useState<Member[]>([]);

  useEffect(() => {
    if (isOpen && activity) {
      // Mock data - replace with actual API call
      setAttendees([
        { id: 1, name: "John Smith", checkInTime: "09:45" },
        { id: 2, name: "Sarah Johnson", checkInTime: "09:50" },
        { id: 3, name: "Michael Brown", checkInTime: "09:55" },
        { id: 4, name: "Emily Davis", checkInTime: "10:00" },
        { id: 5, name: "David Wilson", checkInTime: "10:05" },
      ]);
    }
  }, [isOpen, activity]);

  if (!activity) return null;

  const filteredAttendees = attendees.filter(
    attendee => attendee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Activity Attendance
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View attendance for {activity.name}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Activity Details */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{activity.name}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">
                  {new Date(activity.date).toLocaleDateString()}
                </Badge>
                <Badge variant="secondary">
                  {new Date(`2024-01-01T${activity.time}`).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Badge>
                {activity.location && (
                  <Badge variant="secondary">{activity.location}</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{attendees.length}</div>
              <div className="text-sm text-muted-foreground">Attendees</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Attendees List */}
          <div className="space-y-2">
            {filteredAttendees.map((attendee) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {attendee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{attendee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Checked in at {attendee.checkInTime}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredAttendees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No attendees found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </>
                ) : (
                  <>
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No attendance recorded</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
