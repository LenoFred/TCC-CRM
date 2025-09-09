import { useState } from "react";
import { X, Calendar, User, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  id: number;
  activityName: string;
  activityType: string;
  date: string;
  status: 'Present' | 'Absent' | 'Excused';
  notes?: string;
}

interface MemberAttendanceModalProps {
  memberName: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberAttendanceModal = ({ 
  memberName,
  groupName,
  isOpen, 
  onClose 
}: MemberAttendanceModalProps) => {
  // Mock attendance data
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 1,
      activityName: "Sunday Service",
      activityType: "Worship",
      date: "2024-08-25",
      status: "Present"
    },
    {
      id: 2,
      activityName: "Bible Study",
      activityType: "Study",
      date: "2024-08-22",
      status: "Present"
    },
    {
      id: 3,
      activityName: "Prayer Meeting",
      activityType: "Prayer",
      date: "2024-08-20",
      status: "Absent"
    },
    {
      id: 4,
      activityName: "Fellowship Lunch",
      activityType: "Fellowship",
      date: "2024-08-18",
      status: "Present"
    },
    {
      id: 5,
      activityName: "Outreach Program",
      activityType: "Outreach",
      date: "2024-08-15",
      status: "Excused",
      notes: "Family emergency"
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Absent': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Excused': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Absent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'Excused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const calculateStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'Present').length;
    const absent = attendanceRecords.filter(r => r.status === 'Absent').length;
    const excused = attendanceRecords.filter(r => r.status === 'Excused').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, excused, attendanceRate };
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
            <p className="text-muted-foreground">{groupName} Activities</p>
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
          {/* Attendance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.activityName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.activityType}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.notes && (
                            <span className="text-sm text-muted-foreground">
                              {record.notes}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {attendanceRecords.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No attendance records found</p>
                  <p className="text-sm">Records will appear here as activities are completed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};