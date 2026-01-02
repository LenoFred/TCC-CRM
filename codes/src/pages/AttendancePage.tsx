import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, UserCheck, UserPlus, Calendar, Users, CheckCircle, CalendarCheck, AlertCircle, RefreshCw } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DigitalCheckInModal } from "@/components/DigitalCheckInModal";
import { GroupAttendanceModal } from "@/components/GroupAttendanceModal";
import { SendFollowUpModal } from "@/components/SendFollowUpModal";
import { CreateGatheringModal } from "@/components/CreateGatheringModal";
import { useToast } from "@/hooks/use-toast";

const AttendancePage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [checkedInMembers, setCheckedInMembers] = useState<Set<number>>(new Set());
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSelectEventModalOpen, setIsSelectEventModalOpen] = useState(false);
  const [isGroupAttendanceModalOpen, setIsGroupAttendanceModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isCreateGatheringModalOpen, setIsCreateGatheringModalOpen] = useState(false);
  const [isAttendanceDirectoryOpen, setIsAttendanceDirectoryOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<any>(null);
  const [selectedGatheringForModal, setSelectedGatheringForModal] = useState<any>(null);
  const [selectedAttendanceForView, setSelectedAttendanceForView] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [allGatherings, setAllGatherings] = useState([]); // Store all gatherings for directory
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [guestRecords, setGuestRecords] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingCheckIn, setIsLoadingCheckIn] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [membersError, setMembersError] = useState(null);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [upcomingGatheringsSearch, setUpcomingGatheringsSearch] = useState("");
  const [upcomingGatherings, setUpcomingGatherings] = useState([]);
  const [selectedGatheringToEdit, setSelectedGatheringToEdit] = useState<any>(null);

  // Handle URL parameter for opening check-in session modal
  useEffect(() => {
    const checkinParam = searchParams.get('checkin');
    if (checkinParam === 'true') {
      setIsSelectEventModalOpen(true);
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [searchParams]);

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (timeStr: string): string => {
    const cleanTime = timeStr.trim().toUpperCase();
    
    // If already in 24-hour format (contains :)
    if (cleanTime.match(/^\d{1,2}:\d{2}$/) && !cleanTime.includes('AM') && !cleanTime.includes('PM')) {
      const [hours, minutes] = cleanTime.split(':');
      return `${hours.padStart(2, '0')}:${minutes}:00`;
    }
    
    // Handle 12-hour format with AM/PM
    const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
    if (!match) {
      return '00:00:00'; // Default fallback
    }
    
    let [, hours, minutes, period] = match;
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      console.log('=== FETCHING GATHERINGS AND GROUPS ===');
      console.log('API URL:', 'http://localhost:3001/api/gatherings');
      
      // Fetch both gatherings and groups in parallel
      const [gatheringsResponse, groupsResponse] = await Promise.all([
        api.gatherings.getAll(),
        api.groups.getAll()
      ]);
      
      console.log('Full API Response:', gatheringsResponse);
      console.log('Response type:', typeof gatheringsResponse);
      console.log('Response keys:', Object.keys(gatheringsResponse || {}));
      
      const gatheringsData = gatheringsResponse.data || [];
      const groupsData = groupsResponse.data || [];
      console.log('Extracted gatherings data:', gatheringsData);
      console.log('Extracted groups data:', groupsData);
      console.log('Is array?', Array.isArray(gatheringsData));
      console.log('Data length:', gatheringsData.length);
      
      // Store groups for later use
      setGroups(groupsData);
      
      // Create a map of groupID to groupName for quick lookup
      const groupNameMap = new Map(
        groupsData.map(group => [group.groupID, group.groupName])
      );
      
      if (gatheringsData.length > 0) {
        console.log('First gathering:', gatheringsData[0]);
        console.log('Gathering keys:', Object.keys(gatheringsData[0]));
      }
      
      // Filter gatherings for today with time window (5 hours before to 7 hours after)
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const filteredGatherings = gatheringsData
        .filter(gathering => {
          // Check if date matches today
          if (gathering.gatheringDate !== today) {
            return false;
          }
          
          // If no time specified, include it
          if (!gathering.gatheringTime) {
            return true;
          }
          
          try {
            // Parse gathering time (assumes format like "10:00 AM" or "14:00")
            const timeStr = gathering.gatheringTime.trim();
            const gatheringDateTime = new Date(`${gathering.gatheringDate}T${convertTo24Hour(timeStr)}`);
            
            // Calculate time window: 5 hours before to 7 hours after
            const fiveHoursBefore = new Date(gatheringDateTime.getTime() - (5 * 60 * 60 * 1000));
            const sevenHoursAfter = new Date(gatheringDateTime.getTime() + (7 * 60 * 60 * 1000));
            
            // Check if current time is within the window
            return now >= fiveHoursBefore && now <= sevenHoursAfter;
          } catch (error) {
            console.error('Error parsing gathering time:', error);
            return true; // Include if time parsing fails
          }
        })
        .map(gathering => ({
          ...gathering,
          groupName: groupNameMap.get(gathering.parentID) || gathering.parentID
        }));
      
      console.log('Filtered gatherings (today, within time window):', filteredGatherings.length);
      setEvents(filteredGatherings);
      
      // Store all gatherings with group names for attendance directory
      const allGatheringsWithGroups = gatheringsData.map(gathering => ({
        ...gathering,
        groupName: groupNameMap.get(gathering.parentID) || gathering.parentID
      }));
      setAllGatherings(allGatheringsWithGroups);
      
      // Get upcoming gatherings (future events)
      const upcomingGatheringsData = gatheringsData
        .filter(gathering => {
          if (!gathering.gatheringDate) return false;
          
          try {
            const gatheringDate = new Date(gathering.gatheringDate);
            const timeStr = gathering.gatheringTime ? gathering.gatheringTime.trim() : '00:00';
            const gatheringDateTime = new Date(`${gathering.gatheringDate}T${convertTo24Hour(timeStr)}`);
            
            // Include only future gatherings
            return gatheringDateTime > now;
          } catch (error) {
            return false;
          }
        })
        .map(gathering => ({
          ...gathering,
          groupName: groupNameMap.get(gathering.parentID) || gathering.parentID
        }))
        .sort((a, b) => {
          // Sort by date ascending (soonest first)
          const dateA = new Date(`${a.gatheringDate}T${convertTo24Hour(a.gatheringTime || '00:00')}`);
          const dateB = new Date(`${b.gatheringDate}T${convertTo24Hour(b.gatheringTime || '00:00')}`);
          return dateA.getTime() - dateB.getTime();
        });
      
      setUpcomingGatherings(upcomingGatheringsData);
    } catch (error) {
      console.error('=== ERROR FETCHING GATHERINGS ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setEventsError(error.message || 'Failed to load gatherings');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const membersResponse = await api.members.getAll();
      console.log('Members data received in AttendancePage:', membersResponse);
      const membersData = membersResponse?.data || membersResponse || [];
      console.log('Extracted members array:', membersData);
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

  // Members fetched from API

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    const phone = member.phone || '';
    return !checkedInMembers.has(member.memberID) &&
      (fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       phone.includes(searchTerm));
  });

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
            <p className="text-muted-foreground">Track attendance for gatherings</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAttendanceDirectoryOpen(true)}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Attendance Directory
          </Button>
        </div>

        {/* Event Selection */}
        <Card>
          <CardContent className="py-4">
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

        {/* Upcoming Gatherings List or Attendance Directory */}
        {!isAttendanceDirectoryOpen ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Gatherings for Check-In
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gatherings scheduled beyond the current date/time
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  disabled={isLoadingEvents}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by gathering name, type, or group..."
                  value={upcomingGatheringsSearch}
                  onChange={(e) => setUpcomingGatheringsSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Gatherings List */}
              {isLoadingEvents ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  ))}
                </div>
              ) : eventsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Gatherings</AlertTitle>
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
              ) : upcomingGatherings.filter(gathering => {
                if (!upcomingGatheringsSearch.trim()) return true;
                const searchLower = upcomingGatheringsSearch.toLowerCase();
                return (
                  (gathering.gatheringName || '').toLowerCase().includes(searchLower) ||
                  (gathering.gatheringType || '').toLowerCase().includes(searchLower) ||
                  (gathering.groupName || '').toLowerCase().includes(searchLower)
                );
              }).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Upcoming Gatherings</p>
                  <p className="text-sm mt-1">
                    {upcomingGatheringsSearch ? 'No gatherings match your search' : 'There are no scheduled gatherings beyond the current date/time'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingGatherings
                    .filter(gathering => {
                      if (!upcomingGatheringsSearch.trim()) return true;
                      const searchLower = upcomingGatheringsSearch.toLowerCase();
                      return (
                        (gathering.gatheringName || '').toLowerCase().includes(searchLower) ||
                        (gathering.gatheringType || '').toLowerCase().includes(searchLower) ||
                        (gathering.groupName || '').toLowerCase().includes(searchLower)
                      );
                    })
                    .map((gathering) => {
                      const gatheringDate = new Date(gathering.gatheringDate);
                      const timeStr = gathering.gatheringTime || 'Time TBA';
                      const isToday = gatheringDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={gathering.gatheringID}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {gathering.gatheringName || 'Unnamed Gathering'}
                              </h3>
                              {isToday && (
                                <Badge variant="default" className="bg-green-500">
                                  Today
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {gatheringDate.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span>at {timeStr}</span>
                              <Badge variant="outline" className="text-xs">
                                {gathering.gatheringType || 'No Type'}
                              </Badge>
                              <span className="text-xs">•</span>
                              <span className="text-xs">{gathering.groupName || 'No Group'}</span>
                            </div>
                            {gathering.gatheringLocation && (
                              <p className="text-xs text-muted-foreground">
                                📍 {gathering.gatheringLocation}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedGatheringToEdit(gathering);
                              setIsCreateGatheringModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Attendance Directory Section */
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Directory</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    View attendance records for past gatherings
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAttendanceDirectoryOpen(false);
                    setSelectedAttendanceForView(null);
                    setAttendanceSearchQuery('');
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gathering Selection by Month */}
              <div className="space-y-2">
                <Label>Select Gathering</Label>
                <Select 
                  value={selectedAttendanceForView?.gatheringID || ''} 
                  onValueChange={async (value) => {
                    const gathering = allGatherings.find(g => g.gatheringID === value);
                    setSelectedAttendanceForView(gathering);
                    
                    // Fetch attendance and guest data for this gathering
                    if (gathering) {
                      setIsLoadingAttendance(true);
                      try {
                        const [attendanceResponse, guestResponse] = await Promise.all([
                          api.attendance.getAll(new URLSearchParams({ gatheringID: gathering.gatheringID })),
                          api.guestManagement.getAllGuests()
                        ]);
                        
                        // Both APIs return { success: true, data: [...] } format
                        const attendanceData = attendanceResponse?.data || [];
                        const guestData = guestResponse?.data || [];
                        
                        console.log('Guest data from API:', guestData);
                        console.log('Sample guest:', guestData[0]);
                        console.log('Attendance data:', attendanceData);
                        
                        setAttendanceRecords(Array.isArray(attendanceData) ? attendanceData : []);
                        setGuestRecords(Array.isArray(guestData) ? guestData : []);
                      } catch (error) {
                        console.error('Error fetching attendance:', error);
                        toast({
                          title: "Error",
                          description: "Failed to load attendance records",
                          variant: "destructive"
                        });
                      } finally {
                        setIsLoadingAttendance(false);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gathering" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Group gatherings by month
                      const groupedByMonth = allGatherings.reduce((acc, gathering) => {
                        if (!gathering.gatheringDate) return acc;
                        const date = new Date(gathering.gatheringDate);
                        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                        if (!acc[monthKey]) acc[monthKey] = [];
                        acc[monthKey].push(gathering);
                        return acc;
                      }, {} as Record<string, typeof allGatherings>);

                      // Sort months in descending order (most recent first)
                      const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
                        return new Date(b).getTime() - new Date(a).getTime();
                      });

                      return sortedMonths.map(month => (
                        <div key={month}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {month}
                          </div>
                          {groupedByMonth[month]
                            .sort((a, b) => new Date(b.gatheringDate).getTime() - new Date(a.gatheringDate).getTime())
                            .map((gathering) => (
                              <SelectItem key={gathering.gatheringID} value={gathering.gatheringID}>
                                <div className="flex flex-col py-1">
                                  <span className="font-medium">{gathering.gatheringName || 'Unnamed Gathering'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {gathering.gatheringType || 'No type'} • {gathering.gatheringDate || 'No date'} {gathering.gatheringTime ? `at ${gathering.gatheringTime}` : ''}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              {selectedAttendanceForView && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Checked In Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <div className="text-2xl font-bold text-foreground">
                            {attendanceRecords.filter(a => {
                              const member = members.find(m => m.memberID === a.memberID);
                              return member !== undefined;
                            }).length}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Absent Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <div className="text-2xl font-bold text-foreground">
                            {members.length - attendanceRecords.filter(a => {
                              const member = members.find(m => m.memberID === a.memberID);
                              return member !== undefined;
                            }).length}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Guests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <div className="text-2xl font-bold text-foreground">
                            {attendanceRecords.filter(a => a.memberID && a.memberID.startsWith('GST-')).length}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Present</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <div className="text-2xl font-bold text-foreground">
                            {attendanceRecords.length}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Actions Bar */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search attendees by name, phone, or email..."
                        value={attendanceSearchQuery}
                        onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                        className="pl-10"
                        disabled={isLoadingAttendance}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsFollowUpModalOpen(true)}
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Send Follow-up
                    </Button>
                  </div>

                  {/* Attendees Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Attendees ({attendanceRecords.length})</Label>
                    </div>

                    {isLoadingAttendance ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {attendanceRecords
                              .map(attendance => {
                                // Check if it's a member or guest based on memberID prefix
                                const isGuestRecord = attendance.memberID && attendance.memberID.startsWith('GST-');
                                
                                if (isGuestRecord) {
                                  // Find guest by guestID matching memberID
                                  const guest = guestRecords.find(g => g.guestID === attendance.memberID);
                                  return {
                                    ...attendance,
                                    name: guest?.name || 'Unknown Guest',
                                    phone: guest?.phone || 'N/A',
                                    email: guest?.email || 'N/A',
                                    type: 'Guest'
                                  };
                                } else {
                                  // Find member by memberID
                                  const member = members.find(m => m.memberID === attendance.memberID);
                                  return {
                                    ...attendance,
                                    name: member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : 'Unknown Member',
                                    phone: member?.phone || 'N/A',
                                    email: member?.email || 'N/A',
                                    type: 'Member'
                                  };
                                }
                              })
                              .filter(attendee => {
                                if (!attendanceSearchQuery) return true;
                                const query = attendanceSearchQuery.toLowerCase();
                                return (
                                  attendee.name.toLowerCase().includes(query) ||
                                  attendee.phone.toLowerCase().includes(query) ||
                                  attendee.email.toLowerCase().includes(query)
                                );
                              })
                              .map((attendee) => (
                                <tr key={attendee.attendanceID} className="hover:bg-muted/30">
                                  <td className="px-4 py-3">{attendee.name}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant={attendee.type === 'Member' ? 'default' : 'secondary'}>
                                      {attendee.type}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">{attendee.phone}</td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">{attendee.email}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {attendanceRecords.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No attendance records found for this gathering
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {selectedEventForCheckIn && !isCheckInModalOpen && (
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
                    filteredMembers.map((member) => {
                      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                      const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
                      return (
                      <div
                        key={member.memberID}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium">{fullName}</p>
                            <p className="text-sm text-muted-foreground">{member.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{member.groupName || member.groupID || 'No Group'}</Badge>
                          <Button
                            onClick={() => handleCheckIn(member.memberID)}
                            className="gap-2"
                            disabled={isLoadingCheckIn}
                          >
                            <UserCheck className="h-4 w-4" />
                            Check In
                          </Button>
                        </div>
                      </div>
                    );
                    })
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
                        const member = members.find(m => m.memberID === memberId);
                        const fullName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : 'Unknown';
                        return (
                          <Badge key={memberId} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            {fullName}
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
                      {filteredMembers.slice(0, 3).map((member) => {
                        const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                        return (
                        <Badge key={member.memberID} variant="outline" className="text-orange-600 border-orange-200">
                          {fullName}
                        </Badge>
                      );
                      })}
                      {filteredMembers.length > 3 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          +{filteredMembers.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 w-full"
                      onClick={() => {
                        setIsFollowUpModalOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Send Follow-up
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Select Event Modal */}
        <Dialog open={isSelectEventModalOpen} onOpenChange={setIsSelectEventModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Gathering for Check-in</DialogTitle>
              <DialogDescription>
                Choose a gathering to start taking attendance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingEvents ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading gatherings...</p>
                </div>
              ) : events.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Gatherings Found</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>There are no gatherings in the system. Create a gathering first to start taking attendance.</p>
                    <Button 
                      onClick={() => {
                        setIsSelectEventModalOpen(false);
                        setIsCreateGatheringModalOpen(true);
                      }}
                      className="w-full"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Create New Gathering
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Available Gatherings ({events.length})</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsSelectEventModalOpen(false);
                        setIsCreateGatheringModalOpen(true);
                      }}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      New
                    </Button>
                  </div>
                  <Select 
                    value={selectedEvent} 
                    onValueChange={(value) => {
                      setSelectedEvent(value);
                      const gathering = events.find(e => e.gatheringID === value);
                      setSelectedGatheringForModal(gathering);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a gathering" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((gathering) => (
                        <SelectItem key={gathering.gatheringID} value={gathering.gatheringID}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{gathering.gatheringName || 'Unnamed Gathering'}</span>
                            <span className="text-xs text-muted-foreground">
                              {gathering.gatheringType || 'No type'} • {gathering.gatheringDate || 'No date'} {gathering.gatheringTime ? `at ${gathering.gatheringTime}` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedGatheringForModal && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedGatheringForModal.gatheringName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{selectedGatheringForModal.gatheringType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{selectedGatheringForModal.gatheringDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span>{selectedGatheringForModal.gatheringTime}</span>
                    </div>
                    {selectedGatheringForModal.parentID && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Group:</span>
                        <span>{selectedGatheringForModal.groupName || selectedGatheringForModal.parentID}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {events.length > 0 && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSelectEventModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedGatheringForModal) {
                        setSelectedEventForCheckIn(selectedGatheringForModal);
                        setIsCheckInModalOpen(true);
                        setIsSelectEventModalOpen(false);
                      }
                    }}
                    disabled={!selectedGatheringForModal}
                  >
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Begin Check-in
                  </Button>
                </DialogFooter>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Create Gathering Modal */}
      <CreateGatheringModal
        isOpen={isCreateGatheringModalOpen}
        onClose={() => {
          setIsCreateGatheringModalOpen(false);
          setSelectedGatheringToEdit(null);
        }}
        onSave={async () => {
          console.log(selectedGatheringToEdit ? "Gathering updated" : "Gathering created");
          setIsCreateGatheringModalOpen(false);
          setSelectedGatheringToEdit(null);
          await fetchEvents();
          toast({
            title: selectedGatheringToEdit ? "Gathering Updated" : "Gathering Created",
            description: selectedGatheringToEdit 
              ? "Gathering has been successfully updated" 
              : "New gathering has been successfully created",
          });
        }}
        gathering={selectedGatheringToEdit}
        isEdit={!!selectedGatheringToEdit}
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

      {/* Follow Up Modal for Absent Members and Guests */}
      <SendFollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          absentMembers={selectedAttendanceForView 
            ? members
                .filter(m => !attendanceRecords.find(a => a.memberID === m.memberID))
                .map(m => ({
                  id: m.memberID,
                  name: `${m.firstName} ${m.lastName}`,
                  lastAttended: "2024-08-31"
                }))
            : members
                .filter(m => !checkedInMembers.has(m.memberID))
                .map(m => ({
                  id: m.memberID,
                  name: `${m.firstName} ${m.lastName}`,
                  lastAttended: "2024-08-31"
                }))
          }
          guests={attendanceRecords
            .filter(a => guestRecords.find(g => g.guestID === a.memberID))
            .map(a => {
              const guest = guestRecords.find(g => g.guestID === a.memberID);
              return guest!;
            })
          }
          eventName={selectedAttendanceForView?.gatheringName || events.find(e => e.gatheringID === selectedEvent)?.gatheringName || "the gathering"}
        />
    </DashboardLayout>
  );
};

export default AttendancePage;