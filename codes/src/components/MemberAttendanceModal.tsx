import { useState, useEffect } from "react";
import { X, Calendar, User, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  gatheringID: string;
  gatheringName: string;
  gatheringType: string;
  gatheringDate: string;
  status: 'Present' | 'Absent';
  checkInTime?: string;
}

interface MemberAttendanceModalProps {
  memberID: string;
  memberName: string;
  groupID: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberAttendanceModal = ({ 
  memberID,
  memberName,
  groupID,
  groupName,
  isOpen, 
  onClose 
}: MemberAttendanceModalProps) => {
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && memberID && groupID) {
      fetchAttendanceData();
    }
  }, [isOpen, memberID, groupID]);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all gatherings for this group
      const gatheringsResponse = await api.gatherings.getByGroup(groupID);
      const gatherings = gatheringsResponse.data || [];

      // Fetch attendance records for this member
      const attendanceResponse = await api.attendance.getByMember(memberID);
      const attendanceData = attendanceResponse.attendance || [];

      // Map gatherings with attendance status
      const records: AttendanceRecord[] = gatherings.map((gathering: any) => {
        const attendanceRecord = attendanceData.find(
          (a: any) => a.gatheringID === gathering.gatheringID
        );

        return {
          gatheringID: gathering.gatheringID,
          gatheringName: gathering.gatheringName || 'Unnamed Gathering',
          gatheringType: gathering.gatheringType || 'General',
          gatheringDate: gathering.gatheringDate || '',
          status: attendanceRecord ? 'Present' : 'Absent',
          checkInTime: attendanceRecord?.checkInTime || undefined
        };
      });

      // Sort by date (most recent first)
      records.sort((a, b) => new Date(b.gatheringDate).getTime() - new Date(a.gatheringDate).getTime());

      setAttendanceRecords(records);
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      setError(error.message || 'Failed to load attendance data');
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Absent': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Absent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const calculateStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'Present').length;
    const absent = attendanceRecords.filter(r => r.status === 'Absent').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, attendanceRate };
  };

  const stats = calculateStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-bold">
              Attendance Record - {memberName}
            </DialogTitle>
            <p className="text-muted-foreground">{groupName} Gatherings</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading attendance data...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Attendance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Gatherings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{stats.attendanceRate}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Attendance History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No gatherings found for this group</p>
                      <p className="text-sm">Gatherings will appear here once created</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Gathering</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map((record) => (
                            <TableRow key={record.gatheringID}>
                              <TableCell className="font-medium">{record.gatheringName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{record.gatheringType}</Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(record.gatheringDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(record.status)}
                                  <Badge className={getStatusColor(record.status)}>
                                    {record.status}
                                  </Badge>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};