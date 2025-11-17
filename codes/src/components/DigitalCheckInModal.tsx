import { useState, useEffect } from "react";
import { Search, UserPlus, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

interface Member {
  memberID: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberStatus: string;
}

interface Gathering {
  gatheringID: string;
  gatheringName: string;
  gatheringDate: string;
  gatheringType: string;
}

interface DigitalCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  gathering: Gathering | null;
}

export const DigitalCheckInModal = ({ isOpen, onClose, gathering }: DigitalCheckInModalProps) => {
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [checkedInMemberIDs, setCheckedInMemberIDs] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [checkingInMemberID, setCheckingInMemberID] = useState<string | null>(null);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [guestData, setGuestData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Fetch members from the Members sheet
  useEffect(() => {
    if (isOpen && gathering) {
      setSearchQuery("");
      fetchMembers();
      loadCurrentAttendees();
      
      // Poll for attendees every 30 seconds
      const interval = setInterval(() => {
        loadCurrentAttendees();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, gathering]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      console.log('=== Fetching members for check-in ===');
      const response = await api.members.getAll();
      console.log('Members response:', response);
      
      const membersData = Array.isArray(response) ? response : (response.data || []);
      console.log('Members data:', membersData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error Loading Members",
        description: "Failed to load members list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadCurrentAttendees = async () => {
    if (!gathering) return;
    
    setIsLoadingAttendees(true);
    try {
      console.log('=== Fetching attendees for gathering:', gathering.gatheringID);
      const response = await api.checkIn.getAttendees(gathering.gatheringID);
      console.log('Attendees response:', response);
      
      const attendeesData = Array.isArray(response) ? response : (response.data || []);
      // Extract member IDs from attendees
      const attendeeIds = attendeesData.map((a: any) => a.memberID).filter((id: string) => id);
      console.log('Checked-in member IDs:', attendeeIds);
      setCheckedInMemberIDs(attendeeIds);
    } catch (err) {
      console.error('Error fetching attendees:', err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  const filteredMembers = members.filter(member => {
    // Exclude members who are already checked in
    if (checkedInMemberIDs.includes(member.memberID)) {
      return false;
    }
    
    // Filter by search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.phone?.includes(searchQuery)
    );
  });

  const handleCheckIn = async (memberID: string) => {
    if (!gathering) return;
    
    setCheckingInMemberID(memberID);
    try {
      console.log('=== Checking in member:', memberID, 'to gathering:', gathering.gatheringID);
      
      await api.checkIn.checkInMember({
        memberID,
        gatheringID: gathering.gatheringID,
        method: 'Manual',
      });
      
      // Immediately update UI - no delay needed
      setCheckedInMemberIDs(prev => [...prev, memberID]);
      const member = members.find(m => m.memberID === memberID);
      const memberName = member ? `${member.firstName} ${member.lastName}` : 'Member';
      
      toast({
        title: "Check-in Successful",
        description: `${memberName} has been checked in.`,
      });
      
    } catch (err: any) {
      console.error('Check-in error:', err);
      toast({
        title: "Check-in Failed",
        description: err.message || "Failed to check in member. Please try again.",
        variant: "destructive",
      });
      // Remove from optimistic update if failed
      setCheckedInMemberIDs(prev => prev.filter(id => id !== memberID));
    } finally {
      setCheckingInMemberID(null);
    }
  };

  const handleAddGuest = async () => {
    if (!guestData.firstName.trim()) {
      toast({
        title: "Missing Information",
        description: "First name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!guestData.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Phone number is required.",
        variant: "destructive",
      });
      return;
    }

    if (!gathering) return;

    setIsAddingGuest(true);
    try {
      console.log('=== Registering guest:', guestData);
      
      // Register guest and check them in
      const result = await api.guestManagement.registerGuest({
        firstName: guestData.firstName,
        lastName: guestData.lastName || '',
        phone: guestData.phone,
        email: guestData.email || '',
        gatheringID: gathering.gatheringID,
      });

      console.log('Guest registration result:', result);

      // Check if guest phone already exists
      if (result.isNew === false && result.message) {
        toast({
          title: "Guest Phone Number Already Exists",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Guest Added & Checked In",
          description: `${guestData.firstName} ${guestData.lastName} has been registered and checked in.`,
        });
      }

      // Reset form
      setGuestData({ firstName: "", lastName: "", phone: "", email: "" });
      setIsAddGuestOpen(false);
      
      // Refresh attendee list
      loadCurrentAttendees();
    } catch (err: any) {
      console.error('Guest registration error:', err);
      toast({
        title: "Failed to Add Guest",
        description: err.message || "Could not register guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingGuest(false);
    }
  };

  if (!gathering) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Digital Check-in: {gathering.gatheringName}
          </DialogTitle>
          <DialogDescription>
            Search and check in members for {gathering.gatheringName} on {gathering.gatheringDate}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg h-12"
              autoFocus
              disabled={isLoadingMembers}
            />
          </div>

          {/* Stats and Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{checkedInMemberIDs.length} members checked in • {filteredMembers.length} available</span>
              {(isLoadingAttendees || isLoadingMembers) && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost"
                size="icon"
                onClick={loadCurrentAttendees}
                disabled={isLoadingAttendees}
                title="Refresh attendees"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingAttendees ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddGuestOpen(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add New Guest
              </Button>
            </div>
          </div>

          {/* Add Guest Form */}
          {isAddGuestOpen && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-medium mb-3">Add New Guest</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="guest-firstName">First Name *</Label>
                  <Input
                    id="guest-firstName"
                    placeholder="First Name"
                    value={guestData.firstName}
                    onChange={(e) => setGuestData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guest-lastName">Last Name</Label>
                  <Input
                    id="guest-lastName"
                    placeholder="Last Name"
                    value={guestData.lastName}
                    onChange={(e) => setGuestData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guest-phone">Phone Number *</Label>
                  <Input
                    id="guest-phone"
                    placeholder="Phone Number"
                    value={guestData.phone}
                    onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guest-email">Email</Label>
                  <Input
                    id="guest-email"
                    placeholder="Email Address"
                    type="email"
                    value={guestData.email}
                    onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button 
                  onClick={handleAddGuest} 
                  size="sm"
                  disabled={isAddingGuest}
                >
                  {isAddingGuest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add & Check In'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAddGuestOpen(false);
                    setGuestData({ firstName: "", lastName: "", phone: "", email: "" });
                  }}
                  disabled={isAddingGuest}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoadingMembers ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No members found matching your search." : "All members have been checked in!"}
              </div>
            ) : (
              <div className="grid gap-2 p-4">
                {filteredMembers.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`;
                  return (
                    <div
                      key={member.memberID}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{fullName}</h3>
                          <Badge variant={member.memberStatus === "Guest" ? "secondary" : "outline"}>
                            {member.memberStatus || 'Active'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {member.email && <span>{member.email} • </span>}
                          <span>{member.phone}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleCheckIn(member.memberID)}
                        className="gap-2"
                        disabled={checkingInMemberID === member.memberID}
                      >
                        {checkingInMemberID === member.memberID ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Check In
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {checkedInMemberIDs.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Total Checked In: {checkedInMemberIDs.length}
                </span>
                <Button variant="outline" onClick={onClose}>
                  Close Check-in
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};