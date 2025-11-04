import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, UserCheck, UserPlus, Calendar, Users, Plus, CheckCircle, Eye, Send, CalendarCheck, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CreateEventModal } from "@/components/CreateEventModal";
import { DigitalCheckInModal } from "@/components/DigitalCheckInModal";
import { GroupAttendanceModal } from "@/components/GroupAttendanceModal";
import { EventManagementModal } from "@/components/EventManagementModal";
import { GuestTrackingModal } from "@/components/GuestTrackingModal";
import { SendFollowUpModal } from "@/components/SendFollowUpModal";
import { useToast } from "@/hooks/use-toast";

const AttendancePage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [checkedInMembers, setCheckedInMembers] = useState<Set<number>>(new Set());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSelectEventModalOpen, setIsSelectEventModalOpen] = useState(false);
  const [isGroupAttendanceModalOpen, setIsGroupAttendanceModalOpen] = useState(false);
  const [isEventManagementModalOpen, setIsEventManagementModalOpen] = useState(false);
  const [isGuestTrackingModalOpen, setIsGuestTrackingModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<any>(null);
  const [selectedEventForManagement, setSelectedEventForManagement] = useState<any>(null);
  const [selectedEventForGuestTracking, setSelectedEventForGuestTracking] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingCheckIn, setIsLoadingCheckIn] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [membersError, setMembersError] = useState(null);

  // Handle URL parameter for opening check-in session modal
  useEffect(() => {
    const checkinParam = searchParams.get('checkin');
    if (checkinParam === 'true') {
      setIsSelectEventModalOpen(true);
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const eventsData = await api.events.getAll(new URLSearchParams({ date: 'today' }));
      console.log('Events data received:', eventsData);
      console.log('Is events data array?', Array.isArray(eventsData));
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsError(error.message || 'Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const membersData = await api.members.getAll();
      console.log('Members data received in AttendancePage:', membersData);
      console.log('Is members data array?', Array.isArray(membersData));
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembersError(error.message || 'Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, []);

  // Events fetched from API

  const eventCategories = [
    { value: "all", label: "All Events" },
    { value: "Regular Sunday Service", label: "Regular Sunday Services" },
    { value: "Annual Event", label: "Annual Events" },
    { value: "Meeting", label: "Meetings" },
    { value: "Youth Ministry Activity", label: "Youth Ministry Activities" },
    { value: "Choir Department Activity", label: "Choir Department Activities" }
  ];

  // Members fetched from API

  const filteredMembers = members.filter(member =>
    !checkedInMembers.has(member.id) &&
    (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.phone.includes(searchTerm))
  );

  const handleCheckIn = async (memberId: number) => {
    if (selectedEventForCheckIn) {
      setIsLoadingCheckIn(true);
      try {
        await api.events.checkin(selectedEventForCheckIn.id, { memberIds: [memberId] });
        setCheckedInMembers(new Set([...checkedInMembers, memberId]));
        setSearchTerm(""); // Clear search after check-in
        toast({
          title: "Check-in Successful",
          description: "Member has been checked in successfully",
        });
      } catch (error) {
        console.error('Error checking in member:', error);
        toast({
          title: "Check-in Failed",
          description: "Failed to check in member. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCheckIn(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground">Digital check-in and attendance tracking</p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateEventModalOpen(true)} disabled={isLoadingEvents}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Check-in Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setIsSelectEventModalOpen(true)}
                className="gap-2"
                disabled={isLoadingEvents}
              >
                <CalendarCheck className="h-5 w-5" />
                Start Check-in Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedEventForCheckIn && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{checkedInMembers.size}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{members.length - checkedInMembers.size}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Guests</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">3</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Present</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{checkedInMembers.size + 3}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Check-in Interface */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Digital Check-in
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add New Guest
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Guest</DialogTitle>
                        <DialogDescription>
                          Quickly add and check in a new guest
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="guest-name">Guest Name *</Label>
                          <Input id="guest-name" placeholder="Enter guest's name" />
                        </div>
                        <div>
                          <Label htmlFor="guest-phone">Phone Number *</Label>
                          <Input id="guest-phone" placeholder="Enter phone number" />
                        </div>
                        <div>
                          <Label htmlFor="guest-email">Email (Optional)</Label>
                          <Input id="guest-email" placeholder="Enter email address" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button>Check In Guest</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search member by name or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 text-lg h-12"
                    disabled={isLoadingMembers}
                  />
                </div>

                {/* Members List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{member.group}</Badge>
                          <Button
                            onClick={() => handleCheckIn(member.id)}
                            className="gap-2"
                            disabled={isLoadingCheckIn}
                          >
                            <UserCheck className="h-4 w-4" />
                            Check In
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : searchTerm ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      All eligible members have been checked in!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recently Checked In & Absent Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {checkedInMembers.size > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Recently Checked In
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(checkedInMembers).map((memberId) => {
                        const member = members.find(m => m.id === memberId);
                        return (
                          <Badge key={memberId} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            {member?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Absent Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    Absent Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {filteredMembers.slice(0, 3).map((member) => (
                        <Badge key={member.id} variant="outline" className="text-orange-600 border-orange-200">
                          {member.name}
                        </Badge>
                      ))}
                      {filteredMembers.length > 3 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          +{filteredMembers.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 flex-1"
                        onClick={() => {
                          setIsGuestTrackingModalOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4" />
                        Track Guests
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 flex-1"
                        onClick={() => {
                          setIsFollowUpModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Follow-up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Select Event Modal */}
        <Dialog open={isSelectEventModalOpen} onOpenChange={setIsSelectEventModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Event for Check-in</DialogTitle>
              <DialogDescription>
                Choose a current activity or event to start the check-in process
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Events</Label>
                <Select 
                  value={selectedEvent} 
                  onValueChange={(value) => {
                    setSelectedEvent(value);
                    const event = events.find(e => e.id === value);
                    setSelectedEventForCheckIn(event);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events
                      .filter(event => {
                        const eventDate = new Date(event.date);
                        const today = new Date();
                        return (
                          eventDate.toDateString() === today.toDateString()
                        );
                      })
                      .map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex flex-col">
                            <span>{event.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {event.type} {event.groupName ? `(${event.groupName})` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEventForCheckIn && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedEventForCheckIn.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event Type:</span>
                      <Badge variant="outline">{selectedEventForCheckIn.type}</Badge>
                    </div>
                    {selectedEventForCheckIn.groupName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Group:</span>
                        <span>{selectedEventForCheckIn.groupName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Attendance:</span>
                      <span>{selectedEventForCheckIn.expectedAttendance}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    if (selectedEventForCheckIn) {
                      setIsCheckInModalOpen(true);
                      setIsSelectEventModalOpen(false);
                    }
                  }}
                  disabled={!selectedEventForCheckIn}
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Begin Check-in
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onSave={async (eventData) => {
            try {
              const newEvent = await api.events.create(eventData);
              setEvents([...events, newEvent]);
            } catch (error) {
              console.error('Error creating event:', error);
            }
          }}
        />

        {/* Digital Check-in Modal */}
        <DigitalCheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => {
            setIsCheckInModalOpen(false);
            setSelectedEventForCheckIn(null);
          }}
          gathering={selectedEventForCheckIn}
        />

        {/* Group Attendance Modal */}
        <GroupAttendanceModal
          isOpen={isGroupAttendanceModalOpen}
          onClose={() => {
            setIsGroupAttendanceModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
        />

        {/* Event Management Modal */}
        <EventManagementModal
          isOpen={isEventManagementModalOpen}
          onClose={() => {
            setIsEventManagementModalOpen(false);
            setSelectedEventForManagement(null);
          }}
          event={selectedEventForManagement}
        />

        {/* Guest Tracking Modal */}
        <GuestTrackingModal
          isOpen={isGuestTrackingModalOpen}
          onClose={() => {
            setIsGuestTrackingModalOpen(false);
            setSelectedEventForGuestTracking(null);
          }}
          eventId={selectedEventForGuestTracking?.id || selectedEvent}
          eventName={selectedEventForGuestTracking?.name || events.find(e => e.id === selectedEvent)?.name}
        />

        {/* Follow Up Modal for Absent Members */}
        <SendFollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          absentMembers={members
            .filter(m => !checkedInMembers.has(m.id))
            .map(m => ({
              id: m.id,
              name: m.name,
              lastAttended: "2024-08-31" // You might want to track this in your actual implementation
            }))}
          eventName={events.find(e => e.id === selectedEvent)?.name || "the event"}
        />
      </div>

      {/* Event Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Event Categories */}
            <div className="flex gap-2 flex-wrap">
              {eventCategories.map((category) => (
                <Badge 
                  key={category.value} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    // Filter events by category
                    console.log("Filter by:", category.value);
                  }}
                >
                  {category.label}
                </Badge>
              ))}
            </div>

            {/* Events Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingEvents ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                      </TableRow>
                    ))
                  ) : eventsError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Events Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between">
                            <span>{eventsError}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchEvents}
                              disabled={isLoadingEvents}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No events found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.status === 'Completed' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.expectedAttendance}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEventForManagement(event);
                                setIsEventManagementModalOpen(true);
                              }}
                              disabled={isLoadingEvents}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEventForGuestTracking(event);
                                setIsGuestTrackingModalOpen(true);
                              }}
                              disabled={isLoadingEvents}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Track Guests
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AttendancePage;