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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCheckIn } from "@/hooks/useBusinessLogic";
import { useGuestRegistration } from "@/hooks/useBusinessLogic";

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface Gathering {
  id: number;
  name: string;
  date: string;
  type: string;
}

interface DigitalCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  gathering: Gathering | null;
}

export const DigitalCheckInModal = ({ isOpen, onClose, gathering }: DigitalCheckInModalProps) => {
  const { toast } = useToast();
  
  // Use business logic hooks
  const { checkIn, fetchCurrentAttendees, currentAttendees, loading, error } = useCheckIn();
  const { registerGuest, loading: guestLoading, error: guestError } = useGuestRegistration();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [checkedInMembers, setCheckedInMembers] = useState<number[]>([]);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Mock data - would be fetched from API
  const mockMembers: Member[] = [
    { id: 1, name: "John Smith", email: "john@example.com", phone: "+1234567890", status: "Active" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", phone: "+1234567891", status: "Active" },
    { id: 3, name: "Michael Brown", email: "michael@example.com", phone: "+1234567892", status: "Active" },
    { id: 4, name: "Emily Davis", email: "emily@example.com", phone: "+1234567893", status: "Active" },
    { id: 5, name: "David Wilson", email: "david@example.com", phone: "+1234567894", status: "Active" },
  ];

  useEffect(() => {
    if (isOpen && gathering) {
      // Reset state and fetch current attendees
      setMembers(mockMembers);
      setSearchQuery("");
      loadCurrentAttendees();
      
      // Poll for attendees every 30 seconds
      const interval = setInterval(() => {
        loadCurrentAttendees();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, gathering]);

  const loadCurrentAttendees = async () => {
    if (!gathering) return;
    
    try {
      const attendees = await fetchCurrentAttendees(gathering.id.toString());
      // Extract member IDs from attendees
      const attendeeIds = (attendees || []).map((a: any) => parseInt(a.memberID));
      setCheckedInMembers(attendeeIds);
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  };

  const filteredMembers = members.filter(member => 
    !checkedInMembers.includes(member.id) &&
    (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     member.phone.includes(searchQuery))
  );

  const handleCheckIn = async (memberId: number) => {
    if (!gathering) return;
    
    try {
      await checkIn({
        memberID: memberId.toString(),
        gatheringID: gathering.id.toString(),
        checkInMethod: 'Manual',
      });
      
      // Optimistically update UI
      setCheckedInMembers(prev => [...prev, memberId]);
      const member = members.find(m => m.id === memberId);
      
      toast({
        title: "Check-in Successful",
        description: `${member?.name} has been checked in.`,
      });
      
      // Refresh attendee list
      loadCurrentAttendees();
    } catch (err) {
      console.error('Check-in error:', err);
      toast({
        title: "Check-in Failed",
        description: error || "Failed to check in member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddGuest = async () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and phone number for the guest.",
        variant: "destructive",
      });
      return;
    }

    if (!gathering) return;

    try {
      // Register guest using business logic
      const nameParts = guestName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const result = await registerGuest({
        firstName,
        lastName,
        phone: guestPhone,
        email: '',
      }, gathering.id.toString());

      toast({
        title: "Guest Added & Checked In",
        description: `${guestName} has been registered and checked in.`,
      });

      // Reset form
      setGuestName("");
      setGuestPhone("");
      setIsAddGuestOpen(false);
      
      // Refresh attendee list
      loadCurrentAttendees();
    } catch (err) {
      console.error('Guest registration error:', err);
      toast({
        title: "Failed to Add Guest",
        description: guestError || "Could not register guest. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!gathering) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Digital Check-in: {gathering.name}
          </DialogTitle>
          <DialogDescription>
            Search and check in members for {gathering.name} on {new Date(gathering.date).toLocaleDateString()}
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
            />
          </div>

          {/* Add Guest Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{checkedInMembers.length} members checked in • {filteredMembers.length} available</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost"
                size="icon"
                onClick={loadCurrentAttendees}
                disabled={loading}
                title="Refresh attendees"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add Guest Form */}
          {isAddGuestOpen && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-medium mb-3">Add New Guest</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Guest Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <Input
                  placeholder="Phone Number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button 
                  onClick={handleAddGuest} 
                  size="sm"
                  disabled={guestLoading}
                >
                  {guestLoading ? (
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
                    setGuestName("");
                    setGuestPhone("");
                  }}
                  disabled={guestLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No members found matching your search." : "All members have been checked in!"}
              </div>
            ) : (
              <div className="grid gap-2 p-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{member.name}</h3>
                        <Badge variant={member.status === "Guest" ? "secondary" : "outline"}>
                          {member.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {member.email && <span>{member.email} • </span>}
                        <span>{member.phone}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleCheckIn(member.id)}
                      className="gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Check In
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {checkedInMembers.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Total Checked In: {checkedInMembers.length}
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