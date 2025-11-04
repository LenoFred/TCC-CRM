import { useState, useEffect } from "react";
import { Users, Plus, Calendar, UserCheck, Settings, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const VolunteersPage = () => {
  const { toast } = useToast();
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isManageAssignmentModalOpen, setIsManageAssignmentModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [volunteerRoles, setVolunteerRoles] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [assignmentsError, setAssignmentsError] = useState(null);

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      const roles = await api.volunteers.getRoles();
      console.log('Volunteer roles data received:', roles);
      console.log('Is roles data array?', Array.isArray(roles));
      setVolunteerRoles(Array.isArray(roles) ? roles : []);
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
      const assignments = await api.volunteers.getAll(new URLSearchParams({ status: 'uncompleted' }));
      console.log('Assignments data received:', assignments);
      console.log('Is assignments data array?', Array.isArray(assignments));
      setUpcomingAssignments(Array.isArray(assignments) ? assignments : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignmentsError(error.message || 'Failed to load assignments');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAssignments();
  }, []);

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
        await api.volunteers.updateRole(selectedRole.id, roleData);
        setVolunteerRoles(prev => prev.map(role =>
          role.id === selectedRole.id ? { ...roleData, id: selectedRole.id } : role
        ));
        toast({
          title: "Role Updated",
          description: "Volunteer role has been successfully updated",
        });
      } else {
        // Add new role
        const newRole = await api.volunteers.createRole(roleData);
        setVolunteerRoles(prev => [...prev, newRole]);
        toast({
          title: "Role Created",
          description: "New volunteer role has been successfully created",
        });
      }
      setIsAddRoleModalOpen(false);
      setIsEditRoleModalOpen(false);
      setSelectedRole(null);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Volunteers</h1>
            <p className="text-muted-foreground">Manage volunteer roles and scheduling</p>
          </div>
          <Button className="gap-2" onClick={() => setIsSchedulingModalOpen(true)}>
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
              {isLoadingRoles ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">45</div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">18</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">7</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">Volunteer Roles</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Volunteer Roles
                  </CardTitle>
                  <Button variant="outline" className="gap-2" onClick={() => setIsAddRoleModalOpen(true)} disabled={isLoadingRoles}>
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
                      </div>
                    ) : (
                      volunteerRoles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold">{role.name}</h3>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">
                              {role.activeCount} volunteers
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)} disabled={isSavingRole}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))
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
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Upcoming Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAssignments ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
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
                          <TableCell colSpan={6} className="text-center py-8">
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
                      ) : upcomingAssignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No upcoming assignments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        upcomingAssignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.event}</TableCell>
                            <TableCell>{assignment.date}</TableCell>
                            <TableCell>{assignment.role}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {assignment.volunteers.map((volunteer, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {volunteer}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={assignment.filled >= assignment.needed ? 'default' : 'destructive'}
                                className={assignment.filled >= assignment.needed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
                              >
                                {assignment.filled}/{assignment.needed} filled
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
          onSave={(scheduleData) => {
            console.log("Schedule created:", scheduleData);
          }}
        />

        <ManageAssignmentModal
          isOpen={isManageAssignmentModalOpen}
          onClose={() => {
            setIsManageAssignmentModalOpen(false);
            setSelectedAssignment(null);
          }}
          onSave={(assignmentData) => {
            console.log("Assignment updated:", assignmentData);
          }}
          assignment={selectedAssignment}
        />
      </div>
    </DashboardLayout>
  );
};

export default VolunteersPage;