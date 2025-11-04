import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, Users, UserCheck, BarChart3, Eye, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { SendFollowUpModal } from "./SendFollowUpModal";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: string;
  name: string;
  date: string;
  type: string;
  category: string;
  attendanceCount?: number;
  expectedAttendance?: number;
  status: string;
}

interface EventManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export function EventManagementModal({ isOpen, onClose, event }: EventManagementModalProps) {
  const { toast } = useToast();
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [guests, setGuests] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);

  const fetchEventData = async () => {
    if (!event) return;

    setIsLoadingData(true);
    setDataError(null);
    try {
      const details = await api.events.getDetails(event.id);
      setEventDetails(details);

      const attendees = await api.events.getAttendees(event.id);
      setAttendanceData(attendees);

      const guestData = await api.events.getGuests(event.id);
      setGuests(guestData);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setDataError(error.message || 'Failed to load event data');
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (event && isOpen) {
      fetchEventData();
    }
  }, [event, isOpen]);

  if (!event) return null;

  const absentMembers = []; // Calculate from attendees vs expected

  const eventStats = {
    totalAttendees: attendanceData.length,
    expectedAttendance: event.expectedAttendance || 50,
    guestCount: guests.length,
    absentCount: absentMembers.length,
    attendanceRate: Math.round((attendanceData.length / (event.expectedAttendance || 50)) * 100)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <p className="text-sm text-muted-foreground">
                {event.date} • {event.category} • {event.type}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="absent">Absent Members</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Event Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Total Attendees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{eventStats.totalAttendees}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expected</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{eventStats.expectedAttendance}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Guests</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{eventStats.guestCount}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{eventStats.attendanceRate}%</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Event Name</p>
                    <p className="font-medium">{event.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={event.status === 'Completed' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{event.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{event.category}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{event.type}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Attendance List ({isLoadingData ? '...' : attendanceData.length} present)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Check-in Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : dataError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Attendance Data Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{dataError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchEventData}
                        disabled={isLoadingData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Check-in Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          attendanceData.map((attendee) => (
                            <TableRow key={attendee.id}>
                              <TableCell className="font-medium">{attendee.name}</TableCell>
                              <TableCell>{attendee.checkedInAt}</TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                  {attendee.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="absent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Absent Members ({isLoadingData ? '...' : absentMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Last Attended</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : dataError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Absent Members Data Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{dataError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchEventData}
                        disabled={isLoadingData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Last Attended</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {absentMembers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No absent members found
                            </TableCell>
                          </TableRow>
                        ) : (
                          absentMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>{member.lastAttended}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsFollowUpModalOpen(true)}
                                >
                                  Send Follow-up
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingData ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-12 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-8 w-8 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ) : dataError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Analytics Data Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{dataError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchEventData}
                        disabled={isLoadingData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-bold">{eventStats.attendanceRate}%</p>
                        <p className="text-xs text-muted-foreground">
                          {eventStats.totalAttendees} of {eventStats.expectedAttendance} expected
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Guest Conversion</p>
                        <p className="text-2xl font-bold">{eventStats.guestCount}</p>
                        <p className="text-xs text-muted-foreground">New guests attended</p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Quick Insights</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Peak check-in time: 9:15 - 9:30 AM</li>
                        <li>• {eventStats.guestCount} new guests for follow-up</li>
                        <li>• {absentMembers.length} regular members were absent</li>
                        <li>• Attendance was {eventStats.attendanceRate > 80 ? 'above' : 'below'} expected</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </DialogFooter>
      </DialogContent>

      <SendFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        absentMembers={absentMembers}
        eventName={event.name}
      />
    </Dialog>
  );
}