import { useState, useEffect } from "react";
import { Users, Plus, Calendar, UserCheck, Settings, AlertCircle, RefreshCw, Filter, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AddEditRoleModal } from "@/components/AddEditRoleModal";
import { VolunteerSchedulingModal } from "@/components/VolunteerSchedulingModal";
import { ManageAssignmentModal } from "@/components/ManageAssignmentModal";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";

const VolunteersPage = () => {
  const { toast } = useToast();
  const { canEdit, hasPermission } = usePermission();
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isManageAssignmentModalOpen, setIsManageAssignmentModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [volunteerRoles, setVolunteerRoles] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [pastAssignments, setPastAssignments] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingPastAssignments, setIsLoadingPastAssignments] = useState(true);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [assignmentsError, setAssignmentsError] = useState(null);
  const [pastAssignmentsError, setPastAssignmentsError] = useState(null);

  // Bulk selection state
  const [selectedAssignmentIDs, setSelectedAssignmentIDs] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Past Volunteers Filters
  const [pastVolunteerFilters, setPastVolunteerFilters] = useState({
    startDate: '',
    endDate: '',
    roleID: 'all',
    status: 'all',
    search: '',
  });

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      const rolesResponse: any = await api.volunteers.getRoles();
      console.log('Volunteer roles data received:', rolesResponse);
      const rolesData = rolesResponse?.data || rolesResponse || [];
      setVolunteerRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Error fetching volunteer roles:', error);
      setRolesError(error.message || 'Failed to load volunteer roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    setAssignmentsError(null);
    try {
      // Fetch both regular assignments and volunteer sheet data in parallel
      const [assignmentsResponse, volunteersResponse]: [any, any] = await Promise.all([
        api.volunteers.getAssignments(),
        api.volunteers.getAll()
      ]);
      
      console.log('Assignments data received:', assignmentsResponse);
      console.log('Volunteers (form submissions) data received:', volunteersResponse);
      
      const assignmentsData = assignmentsResponse?.data || assignmentsResponse || [];
      const volunteersData = volunteersResponse?.data || volunteersResponse || [];
      
      // Show all scheduled assignments from regular assignments
      const scheduledAssignments = assignmentsData.filter((a: any) => 
        a.assignmentStatus === 'Scheduled'
      );

      // Transform volunteer sheet data - ONLY Scheduled status
      const selfAssignments = volunteersData
        .filter((volunteer: any) => 
          (volunteer.status === 'Scheduled' || volunteer.Status === 'Scheduled')
        )
        .map((volunteer: any) => ({
          assignmentID: volunteer.volunteerID,
          type: 'Self',
          event: volunteer.departmentOfInterest || 'N/A',
          roleName: volunteer.departmentOfInterest || 'N/A',
          volunteerName: volunteer.fullName || 'N/A',
          status: volunteer.status || volunteer.Status || 'Scheduled',
          assignmentStatus: volunteer.status || volunteer.Status || 'Scheduled',
          assignedDate: volunteer.date || new Date().toISOString().split('T')[0],
          // Store full volunteer data for the modal
          volunteerData: volunteer,
        }));

      // Merge both arrays: regular assignments + self-assignments
      const allAssignments = [...scheduledAssignments, ...selfAssignments];
      
      console.log('Merged assignments (regular + self):', allAssignments.length);
      setUpcomingAssignments(Array.isArray(allAssignments) ? allAssignments : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignmentsError(error.message || 'Failed to load assignments');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const fetchPastAssignments = async () => {
    setIsLoadingPastAssignments(true);
    setPastAssignmentsError(null);
    try {
      // Use api helper with cache buster
      const assignmentsResponse: any = await api.volunteers.getAssignments();
      console.log('Past assignments data received:', assignmentsResponse);
      const assignmentsData = assignmentsResponse?.data || assignmentsResponse || [];
      
      // Show completed assignments (completed or canceled)
      let completedAssignments = assignmentsData.filter((a: any) => 
        a.assignmentStatus === 'Completed' || a.assignmentStatus === 'Canceled'
      );

      // Apply filters
      // Date range filter
      if (pastVolunteerFilters.startDate) {
        completedAssignments = completedAssignments.filter((a: any) => {
          const assignedDate = a.assignedDate || '';
          return assignedDate >= pastVolunteerFilters.startDate;
        });
      }
      if (pastVolunteerFilters.endDate) {
        completedAssignments = completedAssignments.filter((a: any) => {
          const assignedDate = a.assignedDate || '';
          return assignedDate <= pastVolunteerFilters.endDate;
        });
      }

      // Role filter
      if (pastVolunteerFilters.roleID && pastVolunteerFilters.roleID !== 'all') {
        completedAssignments = completedAssignments.filter((a: any) => 
          a.roleID === pastVolunteerFilters.roleID
        );
      }

      // Status filter
      if (pastVolunteerFilters.status && pastVolunteerFilters.status !== 'all') {
        completedAssignments = completedAssignments.filter((a: any) => 
          a.assignmentStatus === pastVolunteerFilters.status
        );
      }

      // Search filter (by volunteer name)
      if (pastVolunteerFilters.search) {
        const searchLower = pastVolunteerFilters.search.toLowerCase();
        completedAssignments = completedAssignments.filter((a: any) => {
          const volunteerName = a.volunteerName || '';
          return volunteerName.toLowerCase().includes(searchLower);
        });
      }
      
      console.log('Completed assignments filtered:', completedAssignments.length);
      setPastAssignments(Array.isArray(completedAssignments) ? completedAssignments : []);
    } catch (error) {
      console.error('Error fetching past assignments:', error);
      setPastAssignmentsError(error.message || 'Failed to load past assignments');
    } finally {
      setIsLoadingPastAssignments(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAssignments();
    fetchPastAssignments();
  }, []);

  // Refetch past assignments when filters change
  useEffect(() => {
    fetchPastAssignments();
  }, [pastVolunteerFilters]);

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsEditRoleModalOpen(true);
  };

  const handleManageAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsManageAssignmentModalOpen(true);
  };

  const handleSaveRole = async (roleData: any) => {
    setIsSavingRole(true);
    try {
      if (selectedRole) {
        // Update existing role
        await api.volunteers.updateRole(selectedRole.roleID || selectedRole.id, roleData);
        toast({
          title: "Role Updated",
          description: "Volunteer role has been successfully updated",
        });
      } else {
        // Add new role
        await api.volunteers.createRole(roleData);
        toast({
          title: "Role Created",
          description: "New volunteer role has been successfully created",
        });
      }
      setIsAddRoleModalOpen(false);
      setIsEditRoleModalOpen(false);
      setSelectedRole(null);
      // Refresh roles list
      await fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Failed to Save Role",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedAssignmentIDs.length === filteredAssignments.length) {
      setSelectedAssignmentIDs([]);
    } else {
      setSelectedAssignmentIDs(filteredAssignments.map((a: any) => a.assignmentID || a.id));
    }
  };

  const handleSelectAssignment = (assignmentID: string) => {
    setSelectedAssignmentIDs(prev =>
      prev.includes(assignmentID)
        ? prev.filter(id => id !== assignmentID)
        : [...prev, assignmentID]
    );
  };

  const filteredAssignments = upcomingAssignments.filter((assignment: any) => {
    if (roleFilter === 'all') return true;
    return assignment.roleID === roleFilter || assignment.roleName === roleFilter;
  });

  const selectedAssignments = upcomingAssignments.filter((a: any) => 
    selectedAssignmentIDs.includes(a.assignmentID || a.id)
  );

  const handleBulkMarkAsConfirmed = async () => {
    setIsPerformingAction(true);
    try {
      for (const assignmentID of selectedAssignmentIDs) {
        const assignment = upcomingAssignments.find((a: any) => (a.assignmentID || a.id) === assignmentID);
        if (!assignment) continue;

        if (assignment.type === 'Self') {
          // Update Status in Volunteer sheet
          await api.volunteers.update(assignment.volunteerID, { status: 'Scheduled' });
        } else {
          // Update AssignmentStatus in VolunteerAssignments sheet
          await api.volunteers.updateAssignment(assignmentID, { assignmentStatus: 'Scheduled' });
        }
      }

      toast({
        title: "Assignments Confirmed",
        description: `${selectedAssignmentIDs.length} assignment(s) marked as confirmed`,
      });

      setSelectedAssignmentIDs([]);
      await fetchAssignments();
    } catch (error) {
      console.error('Error confirming assignments:', error);
      toast({
        title: "Failed to Confirm",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleBulkCancelAssignment = async () => {
    if (!confirm(`Are you sure you want to cancel ${selectedAssignmentIDs.length} assignment(s)?`)) {
      return;
    }

    setIsPerformingAction(true);
    try {
      for (const assignmentID of selectedAssignmentIDs) {
        const assignment = upcomingAssignments.find((a: any) => (a.assignmentID || a.id) === assignmentID);
        if (!assignment) continue;

        if (assignment.type === 'Self') {
          // Update Status in Volunteer sheet
          await api.volunteers.update(assignment.volunteerID, { status: 'Cancelled' });
        } else {
          // Update AssignmentStatus in VolunteerAssignments sheet
          await api.volunteers.updateAssignment(assignmentID, { assignmentStatus: 'Cancelled' });
        }
      }

      toast({
        title: "Assignments Cancelled",
        description: `${selectedAssignmentIDs.length} assignment(s) cancelled successfully`,
      });

      setSelectedAssignmentIDs([]);
      await fetchAssignments();
    } catch (error) {
      console.error('Error cancelling assignments:', error);
      toast({
        title: "Failed to Cancel",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleOpenSendMessage = () => {
    setShowMessageModal(true);
    setMessageText('');
  };

  const handleSendBulkMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);
    try {
      // Get phone numbers of selected volunteers
      const phoneNumbers = selectedAssignments
        .map((a: any) => {
          if (a.type === 'Self') {
            return a.phone || a.phoneNumber;
          } else {
            // For staff-assigned, we'd need member's phone - placeholder for now
            return null;
          }
        })
        .filter(Boolean);

      if (phoneNumbers.length === 0) {
        toast({
          title: "No Phone Numbers",
          description: "Selected volunteers don't have phone numbers",
          variant: "destructive",
        });
        return;
      }

      // Send messages (placeholder - implement based on your messaging service)
      console.log('Sending message to:', phoneNumbers);
      console.log('Message:', messageText);

      toast({
        title: "Messages Sent",
        description: `Message sent to ${phoneNumbers.length} volunteer(s)`,
      });

      setShowMessageModal(false);
      setMessageText('');
      setSelectedAssignmentIDs([]);
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "Failed to Send",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Volunteers</h1>
            <p className="text-muted-foreground">Manage volunteer roles and scheduling</p>
          </div>
          <Button className="gap-2" onClick={() => setIsSchedulingModalOpen(true)} disabled={!hasPermission('can_manage_volunteers')}>
            <Plus className="h-4 w-4" />
            Schedule Volunteers
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {new Set(upcomingAssignments.map((a: any) => a.memberID)).size}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volunteer Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{volunteerRoles.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{upcomingAssignments.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Past Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPastAssignments ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{pastAssignments.length}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">Volunteer Roles</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="past">Past Volunteers</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Volunteer Roles
                  </CardTitle>
                  <Button variant="outline" className="gap-2" onClick={() => setIsAddRoleModalOpen(true)} disabled={isLoadingRoles || !canEdit('volunteers')}>
                    <Plus className="h-4 w-4" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRoles ? (
                  <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-8 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : rolesError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Roles Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{rolesError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRoles}
                        disabled={isLoadingRoles}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {volunteerRoles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No volunteer roles found</p>
                        <Button className="mt-4" onClick={() => setIsAddRoleModalOpen(true)} disabled={!canEdit('volunteers')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Role
                        </Button>
                      </div>
                    ) : (
                      volunteerRoles.map((role: any) => {
                        const assignmentCount = upcomingAssignments.filter((a: any) => a.roleID === role.roleID).length;
                        return (
                        <div key={role.roleID} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold">{role.roleName || 'Unnamed Role'}</h3>
                            <p className="text-sm text-muted-foreground">{role.description || 'No description'}</p>
                            {role.groupID && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {role.groupName || role.groupID}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">
                              {assignmentCount} scheduled
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)} disabled={isSavingRole}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Create Volunteer Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an event and create volunteer slots</p>
                  <Button className="mt-4" onClick={() => setIsSchedulingModalOpen(true)}>Create Schedule</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Upcoming Assignments
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedAssignmentIDs.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isPerformingAction}>
                            Actions ({selectedAssignmentIDs.length})
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleBulkMarkAsConfirmed}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkCancelAssignment}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Assignment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleOpenSendMessage}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {volunteerRoles.map((role: any) => (
                          <SelectItem key={role.roleID || role.id} value={role.roleID || role.id}>
                            {role.roleName || role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedAssignmentIDs.length === filteredAssignments.length && filteredAssignments.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="w-[20%] min-w-[120px]">Event</TableHead>
                          <TableHead className="w-[15%] min-w-[100px]">Type</TableHead>
                          <TableHead className="w-[20%] min-w-[120px]">Role</TableHead>
                          <TableHead className="w-[20%] min-w-[120px]">Assigned</TableHead>
                          <TableHead className="w-[15%] min-w-[100px]">Status</TableHead>
                          <TableHead className="w-[10%] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {isLoadingAssignments ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : assignmentsError ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Alert variant="destructive" className="max-w-md mx-auto">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Assignments Error</AlertTitle>
                              <AlertDescription className="flex items-center justify-between">
                                <span>{assignmentsError}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={fetchAssignments}
                                  disabled={isLoadingAssignments}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                              </AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      ) : filteredAssignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {roleFilter === 'all' ? 'No upcoming assignments found' : 'No assignments found for selected role'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssignments.map((assignment: any) => (
                          <TableRow key={assignment.assignmentID}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAssignmentIDs.includes(assignment.assignmentID || assignment.id)}
                                onCheckedChange={() => handleSelectAssignment(assignment.assignmentID || assignment.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium truncate max-w-[200px]">
                              {assignment.type === 'Self' 
                                ? assignment.event 
                                : (assignment.groupName || assignment.groupID || 'N/A')}
                            </TableCell>
                            <TableCell className="truncate">
                              {assignment.type === 'Self' 
                                ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Self</Badge>
                                : (assignment.groupType || 'Staff-Assigned')}
                            </TableCell>
                            <TableCell className="truncate max-w-[150px]">{assignment.roleName || assignment.roleID || 'N/A'}</TableCell>
                            <TableCell className="truncate max-w-[150px]">
                              <Badge variant="outline" className="text-xs">
                                {assignment.type === 'Self' 
                                  ? assignment.volunteerName 
                                  : (assignment.memberName || assignment.memberID || 'Unassigned')}
                              </Badge>
                            </TableCell>
                            <TableCell className="truncate">
                              <Badge
                                variant={assignment.status === 'Completed' || assignment.status === 'Complete' ? 'default' : 'secondary'}
                                className={assignment.status === 'Completed' || assignment.status === 'Complete' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              >
                                {assignment.type === 'Self' 
                                  ? (assignment.status || assignment.Status || 'Scheduled')
                                  : (assignment.assignmentStatus || 'Scheduled')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleManageAssignment(assignment)} disabled={isSavingRole}>
                                Manage
                              </Button>
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
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Past Volunteers
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPastAssignments}
                    disabled={isLoadingPastAssignments}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPastAssignments ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters Section */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium mb-3">Filter Past Volunteers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={pastVolunteerFilters.startDate}
                        onChange={(e) => setPastVolunteerFilters({ ...pastVolunteerFilters, startDate: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-xs">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={pastVolunteerFilters.endDate}
                        onChange={(e) => setPastVolunteerFilters({ ...pastVolunteerFilters, endDate: e.target.value })}
                        className="h-9"
                      />
                    </div>

                    {/* Role Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="roleFilter" className="text-xs">Role</Label>
                      <Select
                        value={pastVolunteerFilters.roleID}
                        onValueChange={(value) => setPastVolunteerFilters({ ...pastVolunteerFilters, roleID: value })}
                      >
                        <SelectTrigger id="roleFilter" className="h-9">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {volunteerRoles.map((role: any) => (
                            <SelectItem key={role.roleID || role.id} value={role.roleID || role.id}>
                              {role.roleName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="statusFilter" className="text-xs">Status</Label>
                      <Select
                        value={pastVolunteerFilters.status}
                        onValueChange={(value) => setPastVolunteerFilters({ ...pastVolunteerFilters, status: value })}
                      >
                        <SelectTrigger id="statusFilter" className="h-9">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                      <Label htmlFor="searchVolunteer" className="text-xs">Search Volunteer</Label>
                      <Input
                        id="searchVolunteer"
                        type="text"
                        placeholder="Name..."
                        value={pastVolunteerFilters.search}
                        onChange={(e) => setPastVolunteerFilters({ ...pastVolunteerFilters, search: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPastVolunteerFilters({ startDate: '', endDate: '', roleID: 'all', status: 'all', search: '' })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {isLoadingPastAssignments ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                      </div>
                    ))}
                  </div>
                ) : pastAssignmentsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Past Assignments Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{pastAssignmentsError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPastAssignments}
                        disabled={isLoadingPastAssignments}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-lg">
                    <div className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[20%] min-w-[120px]">Event</TableHead>
                            <TableHead className="w-[15%] min-w-[100px]">Type</TableHead>
                            <TableHead className="w-[20%] min-w-[120px]">Role</TableHead>
                            <TableHead className="w-[20%] min-w-[120px]">Volunteer</TableHead>
                            <TableHead className="w-[15%] min-w-[100px]">Assigned Date</TableHead>
                            <TableHead className="w-[10%] min-w-[100px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {pastAssignments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No past volunteer assignments found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          pastAssignments.map((assignment: any) => (
                            <TableRow key={assignment.assignmentID}>
                              <TableCell className="font-medium truncate max-w-[200px]">
                                {assignment.groupName || assignment.groupID || 'N/A'}
                              </TableCell>
                              <TableCell className="truncate">
                                {assignment.groupType || 'N/A'}
                              </TableCell>
                              <TableCell className="truncate max-w-[150px]">{assignment.roleName || assignment.roleID || 'N/A'}</TableCell>
                              <TableCell className="truncate max-w-[150px]">
                                <Badge variant="outline" className="text-xs">
                                  {assignment.memberName || assignment.memberID || 'Unassigned'}
                                </Badge>
                              </TableCell>
                              <TableCell className="truncate">
                                {assignment.assignmentDate || 'N/A'}
                              </TableCell>
                              <TableCell className="truncate">
                                <Badge
                                  variant={assignment.assignmentStatus === 'Completed' ? 'default' : 'secondary'}
                                  className={assignment.assignmentStatus === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
                                >
                                  {assignment.assignmentStatus || 'N/A'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AddEditRoleModal
          isOpen={isAddRoleModalOpen}
          onClose={() => setIsAddRoleModalOpen(false)}
          onSave={handleSaveRole}
        />

        <AddEditRoleModal
          isOpen={isEditRoleModalOpen}
          onClose={() => {
            setIsEditRoleModalOpen(false);
            setSelectedRole(null);
          }}
          onSave={handleSaveRole}
          role={selectedRole}
          isEdit={true}
        />

        <VolunteerSchedulingModal
          isOpen={isSchedulingModalOpen}
          onClose={() => setIsSchedulingModalOpen(false)}
          onSave={async (scheduleData) => {
            console.log("Schedule created:", scheduleData);
            setIsSchedulingModalOpen(false);
            await fetchAssignments();
            toast({
              title: "Schedule Created",
              description: "Volunteer schedule has been successfully created",
            });
          }}
        />

        <ManageAssignmentModal
          isOpen={isManageAssignmentModalOpen}
          onClose={() => {
            setIsManageAssignmentModalOpen(false);
            setSelectedAssignment(null);
          }}
          onSave={async (assignmentData) => {
            console.log("Assignment updated:", assignmentData);
            setIsManageAssignmentModalOpen(false);
            setSelectedAssignment(null);
            // Refresh both active and past assignments to reflect changes
            await Promise.all([
              fetchAssignments(),
              fetchPastAssignments()
            ]);
            toast({
              title: "Assignment Updated",
              description: "Volunteer assignment has been successfully updated",
            });
          }}
          assignment={selectedAssignment}
        />

        {/* Send Bulk Message Modal */}
        <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to Selected Volunteers</DialogTitle>
              <DialogDescription>
                Send a message to {selectedAssignmentIDs.length} selected volunteer(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowMessageModal(false)}
                disabled={isSendingMessage}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBulkMessage}
                disabled={isSendingMessage || !messageText.trim()}
              >
                {isSendingMessage ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default VolunteersPage;