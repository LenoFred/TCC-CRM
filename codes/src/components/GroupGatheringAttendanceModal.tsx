import { useState, useEffect } from "react";
import { X, Users, Search, CalendarDays, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Activity {
  id: string;
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
  memberID: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  checkInTime: string;
  status?: string;
  type?: 'member' | 'guest';
}

interface GroupGatheringAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  activity: Activity | null;
}

export const GroupGatheringAttendanceModal = ({ 
  isOpen, 
  onClose, 
  group,
  activity 
}: GroupGatheringAttendanceModalProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [attendees, setAttendees] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activity) {
      fetchAttendance();
    }
  }, [isOpen, activity]);

  const fetchAttendance = async () => {
    if (!activity) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching attendance for gathering:', activity.id);
      const response = await api.attendance.getByGathering(activity.id);
      console.log('Attendance response:', response);
      
      // The API returns { gatheringID, total, attendance: [...] }
      const attendanceData = response.attendance || [];
      
      console.log('Sample attendance record:', attendanceData[0]);
      
      // Transform the data to match our interface
      const transformedAttendees: Member[] = attendanceData.map((record: any) => {
        console.log('Transforming record:', record);
        return {
          memberID: record.memberID,
          firstName: record.member?.firstName || 'Unknown',
          lastName: record.member?.lastName || 'Person',
          phoneNumber: record.member?.phoneNumber || '',
          email: record.member?.email || '',
          checkInTime: record.checkInTime || '',
          status: record.status || 'Present',
          type: record.member?.type || 'member'
        };
      });
      
      console.log('Transformed attendees:', transformedAttendees);
      
      setAttendees(transformedAttendees);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      setError(error.message || 'Failed to load attendance');
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!activity) return null;

  const filteredAttendees = attendees.filter(
    attendee => {
      const fullName = `${attendee.firstName} ${attendee.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    }
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

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading attendance...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No attendance taken for this gathering yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the Digital Check-In feature to record attendance
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttendees.map((attendee) => (
                <div
                  key={attendee.memberID}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {attendee.firstName[0]}{attendee.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{attendee.firstName} {attendee.lastName}</p>
                        <Badge variant={attendee.type === 'guest' ? 'secondary' : 'default'} className="text-xs">
                          {attendee.type === 'guest' ? 'Guest' : 'Member'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {attendee.status || 'Present'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary">
                      {attendee.phoneNumber || 'N/A'}
                    </Badge>
                    {attendee.checkInTime && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(`2024-01-01T${attendee.checkInTime}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredAttendees.length === 0 && attendees.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No attendees found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
