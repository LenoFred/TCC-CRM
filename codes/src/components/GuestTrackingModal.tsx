import { useState, useEffect } from "react";
import { Users, UserPlus, Phone, Mail, Calendar, Clock } from "lucide-react";
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
import { Guest, GuestTrackingService } from "@/utils/guestTracking";

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
  const [guests, setGuests] = useState<Guest[]>([]);
  const [followUpTasks, setFollowUpTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockGuests: Guest[] = [
    {
      id: "guest_1",
      name: "Alice Johnson",
      phone: "+1234567890",
      email: "alice@example.com",
      firstVisit: "2024-08-25T10:00:00Z",
      lastVisit: "2024-08-31T10:00:00Z",
      visitCount: 2,
      status: "Returning",
      source: "Invitation",
      followUpStatus: "Pending",
      assignedTo: "staff_1",
      notes: "Interested in youth programs"
    },
    {
      id: "guest_2", 
      name: "Bob Smith",
      phone: "+1234567891",
      firstVisit: "2024-08-31T10:00:00Z",
      lastVisit: "2024-08-31T10:00:00Z",
      visitCount: 1,
      status: "New",
      source: "Walk-in",
      followUpStatus: "Pending",
      notes: "First time visitor, showed interest in community service"
    },
    {
      id: "guest_3",
      name: "Carol Davis",
      phone: "+1234567892",
      email: "carol@example.com",
      firstVisit: "2024-08-10T10:00:00Z",
      lastVisit: "2024-08-31T10:00:00Z",
      visitCount: 4,
      status: "Returning",
      source: "Online",
      followUpStatus: "Contacted",
      assignedTo: "staff_2",
      notes: "Regular attender, potential member"
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setGuests(mockGuests);
        const tasks = GuestTrackingService.generateFollowUpTasks(mockGuests);
        setFollowUpTasks(tasks);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  const handleConvertToMember = (guest: Guest) => {
    toast({
      title: "Convert to Member",
      description: `Opening member creation form for ${guest.name}`,
    });
    // This would open the AddEditMemberModal with pre-filled data
  };

  const handleUpdateFollowUp = (guestId: string, status: string) => {
    setGuests(prev => prev.map(guest => 
      guest.id === guestId 
        ? { ...guest, followUpStatus: status as any }
        : guest
    ));
    
    toast({
      title: "Follow-up Updated",
      description: "Guest follow-up status has been updated successfully.",
    });
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Guest Tracking & Follow-up
          </DialogTitle>
          <DialogDescription>
            Track guests and manage follow-up activities for {eventName || 'all events'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="guests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guests">Guests ({guests.length})</TabsTrigger>
            <TabsTrigger value="follow-up">Follow-up Tasks ({followUpTasks.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
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
                  {guests.map((guest) => (
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
                            >
                              Convert to Member
                            </Button>
                          )}
                          {guest.followUpStatus === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateFollowUp(guest.id, 'Contacted')}
                            >
                              Mark Contacted
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="follow-up" className="space-y-4">
            <div className="grid gap-4">
              {followUpTasks.map((task, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{task.taskType}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Guest: {task.guestName}
                        </p>
                      </div>
                      <Badge variant={task.priority === 'High' ? 'destructive' : 
                                   task.priority === 'Medium' ? 'default' : 'secondary'}>
                        {task.priority} Priority
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Assign to Staff
                        </Button>
                        <Button size="sm">
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Guests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{guests.length}</div>
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
                    {guests.filter(g => g.status === 'New').length}
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
                    {guests.filter(g => g.status === 'Returning').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Follow-ups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {guests.filter(g => g.followUpStatus === 'Pending').length}
                  </div>
                </CardContent>
              </Card>
            </div>

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
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};