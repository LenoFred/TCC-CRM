import { useState } from "react";
import { Search, UserCheck, UserPlus, Calendar, Users, Plus, CheckCircle, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

const AttendancePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [checkedInMembers, setCheckedInMembers] = useState<Set<number>>(new Set());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isGroupAttendanceModalOpen, setIsGroupAttendanceModalOpen] = useState(false);
  const [isEventManagementModalOpen, setIsEventManagementModalOpen] = useState(false);
  const [isGuestTrackingModalOpen, setIsGuestTrackingModalOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<any>(null);
  const [selectedEventForManagement, setSelectedEventForManagement] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Mock data
  const events = [
    { id: "1", name: "Sunday Service", date: "2024-08-31", type: "Service", category: "Regular Sunday Service", status: "Completed", expectedAttendance: 45 },
    { id: "2", name: "Youth Fellowship", date: "2024-08-31", type: "Group", category: "Youth Ministry Activity", status: "Completed", expectedAttendance: 25, groupName: "Youth Ministry" },
    { id: "3", name: "Prayer Meeting", date: "2024-08-28", type: "Meeting", category: "Prayer Meeting", status: "Completed", expectedAttendance: 30 },
    { id: "4", name: "Choir Practice", date: "2024-08-30", type: "Group", category: "Choir Department Activity", status: "Completed", expectedAttendance: 15, groupName: "Choir Department" },
    { id: "5", name: "Bible Study", date: "2024-08-29", type: "Group", category: "Youth Ministry Activity", status: "Completed", expectedAttendance: 20, groupName: "Youth Ministry" },
    { id: "6", name: "Easter Service", date: "2024-03-31", type: "Service", category: "Annual Event", status: "Completed", expectedAttendance: 120 },
    { id: "7", name: "Christmas Service", date: "2023-12-25", type: "Service", category: "Annual Event", status: "Completed", expectedAttendance: 150 },
    { id: "8", name: "Board Meeting", date: "2024-08-25", type: "Meeting", category: "Meeting", status: "Completed", expectedAttendance: 12 }
  ];

  const eventCategories = [
    { value: "all", label: "All Events" },
    { value: "Regular Sunday Service", label: "Regular Sunday Services" },
    { value: "Annual Event", label: "Annual Events" },
    { value: "Meeting", label: "Meetings" },
    { value: "Youth Ministry Activity", label: "Youth Ministry Activities" },
    { value: "Choir Department Activity", label: "Choir Department Activities" }
  ];

  const members = [
    { id: 1, name: "John Smith", phone: "+1 234-567-8901", group: "Adult", status: "Active" },
    { id: 2, name: "Mary Johnson", phone: "+1 234-567-8902", group: "Adult", status: "Active" },
    { id: 3, name: "David Wilson", phone: "+1 234-567-8903", group: "Youth", status: "Active" },
    { id: 4, name: "Sarah Brown", phone: "+1 234-567-8904", group: "Adult", status: "Active" },
    { id: 5, name: "Michael Davis", phone: "+1 234-567-8905", group: "Youth", status: "Active" }
  ];

  const filteredMembers = members.filter(member =>
    !checkedInMembers.has(member.id) &&
    (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.phone.includes(searchTerm))
  );

  const handleCheckIn = (memberId: number) => {
    setCheckedInMembers(new Set([...checkedInMembers, memberId]));
    setSearchTerm(""); // Clear search after check-in
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
          <Button className="gap-2" onClick={() => setIsCreateEventModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="event-select">Event/Gathering</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event or gathering" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex flex-col">
                          <span>{event.name} - {event.date}</span>
                          <span className="text-sm text-muted-foreground">
                            {event.type} {event.groupName ? `(${event.groupName})` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={!selectedEvent} onClick={() => {
                const event = events.find(e => e.id === selectedEvent);
                setSelectedEventForCheckIn(event);
                setIsCheckInModalOpen(true);
              }}>
                Start Check-in Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedEvent && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{checkedInMembers.size}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{members.length - checkedInMembers.size}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Guests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">3</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{checkedInMembers.size + 3}</div>
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
                          console.log("Send follow-up to absent members");
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

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onSave={(eventData) => {
            // Add event to the events list (in a real app, this would be an API call)
            console.log("New event created:", eventData);
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
          onClose={() => setIsGuestTrackingModalOpen(false)}
          eventId={selectedEvent}
          eventName={events.find(e => e.id === selectedEvent)?.name}
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
                  {events.map((event) => (
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedEventForManagement(event);
                            setIsEventManagementModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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