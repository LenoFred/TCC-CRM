import { useState, useEffect } from "react";
import { Users, UserPlus, Phone, Mail, Calendar, Clock, Send, AlertCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGuestRegistration, useGuests } from "@/hooks/useBusinessLogic";
import { SendFollowUpModal } from "@/components/SendFollowUpModal";
import { AddEditMemberModal } from "@/components/AddEditMemberModal";

// Guest interface
interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  status: string;
  source?: string;
  followUpStatus: string;
  assignedTo?: string;
  notes?: string;
}

interface GuestTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  eventName?: string;
}

export const GuestTrackingModal = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventName 
}: GuestTrackingModalProps) => {
  const { toast } = useToast();
  
  // Use business logic hooks
  const { convertToMember, loading: convertLoading, error: convertError } = useGuestRegistration();
  const { fetchGuests, fetchStats, guests: guestList, stats, loading, error } = useGuests();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState("guests");

  // Fetch guests when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGuests();
      loadStats();
    }
  }, [isOpen, eventId]);

  const loadGuests = async () => {
    try {
      const data = await fetchGuests(false); // Don't include members
      // Transform API data to match Guest interface
      const transformedGuests: Guest[] = (data || []).map((g: any) => ({
        id: g.id || g.guestID || `guest_${Date.now()}`,
        name: `${g.firstName || ''} ${g.lastName || ''}`.trim(),
        phone: g.phone || '',
        email: g.email || '',
        firstVisit: g.firstVisit || new Date().toISOString(),
        lastVisit: g.lastVisit || new Date().toISOString(),
        visitCount: g.visitCount || 1,
        status: g.visitCount > 1 ? 'Returning' : 'New',
        source: g.invitedBy || 'Walk-in',
        followUpStatus: g.followUpStatus || 'Pending',
        assignedTo: g.assignedTo,
        notes: g.notes || g.interests || '',
      }));
      setGuests(transformedGuests);
    } catch (err) {
      console.error('Error fetching guests:', err);
      toast({
        title: "Error",
        description: error || "Failed to load guests",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      await fetchStats(30); // Last 30 days
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleConvertToMember = async (guest: Guest) => {
    try {
      await convertToMember(guest.id, {
        firstName: guest.name.split(' ')[0],
        lastName: guest.name.split(' ').slice(1).join(' '),
        email: guest.email || '',
        phone: guest.phone || '',
        notes: guest.notes || '',
      });
      
      setSelectedGuest(guest);
      setShowAddMemberModal(true);
      
      toast({
        title: "Guest Converted",
        description: `${guest.name} has been converted to a member`,
      });
      
      // Refresh guest list
      loadGuests();
    } catch (err) {
      console.error('Error converting guest:', err);
      toast({
        title: "Conversion Failed",
        description: convertError || "Failed to convert guest to member",
        variant: "destructive",
      });
    }
  };

  const handleContact = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowContactModal(true);
  };

  const handleMarkContacted = (guestId: string) => {
    setGuests(prev => prev.map(guest => 
      guest.id === guestId 
        ? { ...guest, followUpStatus: 'Contacted' }
        : guest
    ));
    
    toast({
      title: "Contact Status Updated",
      description: "Guest has been marked as contacted.",
    });
  };

  const handleSaveMember = (member: any) => {
    toast({
      title: "Member Created",
      description: `Successfully converted ${member.firstName} to a member`,
    });
    setShowAddMemberModal(false);
    // Refresh guest list to remove converted guest
    loadGuests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Returning': return 'bg-green-100 text-green-800 border-green-200';
      case 'Member': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFollowUpColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Contacted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader className="flex flex-row justify-between items-center">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guest Tracking
            </DialogTitle>
            <DialogDescription>
              Track guests and manage follow-up activities for {eventName || 'all events'}
            </DialogDescription>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowFollowUpModal(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Follow-up
          </Button>
        </DialogHeader>

        <Tabs defaultValue="guests" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guests">Guests ({guests.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
            {loading ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Guests</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadGuests}
                    disabled={loading}
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
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No guests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      guests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{guest.name}</p>
                              {guest.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {guest.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {guest.phone}
                              </div>
                              {guest.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {guest.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(guest.status)}>
                              {guest.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium">{guest.visitCount}</div>
                              <div className="text-xs text-muted-foreground">
                                Last: {new Date(guest.lastVisit).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getFollowUpColor(guest.followUpStatus)}>
                              {guest.followUpStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {guest.status !== 'Member' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConvertToMember(guest)}
                                  disabled={convertLoading}
                                >
                                  {convertLoading ? 'Converting...' : 'Convert to Member'}
                                </Button>
                              )}
                              {guest.followUpStatus !== 'Contacted' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContact(guest)}
                                >
                                  Contact
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                >
                                  Contacted
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Analytics</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadStats}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Guests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalGuests || guests.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      New Guests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.newGuests || guests.filter(g => g.status === 'New').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Returning Guests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.returningGuests || guests.filter(g => g.status === 'Returning').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.conversionRate ? `${stats.conversionRate}%` : '0%'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Guest Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>First-time Visitors</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-sm font-medium">
                        {guests.filter(g => g.visitCount === 1).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Return Visitors (2+ visits)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">
                        {guests.filter(g => g.visitCount >= 2).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Converted to Members</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm font-medium">
                        {guests.filter(g => g.status === 'Member').length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Add/Edit Member Modal */}
        <AddEditMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSave={handleSaveMember}
          member={selectedGuest ? {
            firstName: selectedGuest.name.split(' ')[0],
            surname: selectedGuest.name.split(' ').slice(1).join(' '),
            email: selectedGuest.email || '',
            phone: selectedGuest.phone || '',
            status: 'Active',
            joinDate: new Date().toISOString().split('T')[0],
          } : null}
        />

        {/* Follow Up Modal */}
        <SendFollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          absentMembers={guests.filter(g => g.followUpStatus === 'Pending').map(g => ({
            id: parseInt(g.id.replace('guest_', '')),
            name: g.name,
            lastAttended: g.lastVisit,
          }))}
          eventName={eventName || 'recent event'}
        />

        {/* Individual Contact Modal */}
        <SendFollowUpModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            if (selectedGuest) {
              handleMarkContacted(selectedGuest.id);
            }
          }}
          absentMembers={selectedGuest ? [{
            id: parseInt(selectedGuest.id.replace('guest_', '')),
            name: selectedGuest.name,
            lastAttended: selectedGuest.lastVisit,
          }] : []}
          eventName={eventName || 'recent event'}
        />
      </DialogContent>
    </Dialog>
  );
};