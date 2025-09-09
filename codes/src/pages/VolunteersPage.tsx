import { useState } from "react";
import { Users, Plus, Calendar, UserCheck, Settings } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const VolunteersPage = () => {
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isManageAssignmentModalOpen, setIsManageAssignmentModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Mock data
  const [volunteerRoles, setVolunteerRoles] = useState([
    { id: 1, name: "Usher", description: "Welcome guests and assist with seating", activeCount: 8 },
    { id: 2, name: "Greeter", description: "Welcome people at the entrance", activeCount: 6 },
    { id: 3, name: "Sound Tech", description: "Operate sound equipment", activeCount: 4 },
    { id: 4, name: "Worship Team", description: "Lead congregational worship", activeCount: 12 },
    { id: 5, name: "Children's Ministry", description: "Assist with children's programs", activeCount: 15 }
  ]);

  const upcomingAssignments = [
    {
      id: 1,
      event: "Sunday Service",
      date: "2024-09-01",
      role: "Usher",
      volunteers: ["John Smith", "Mary Johnson"],
      needed: 4,
      filled: 2
    },
    {
      id: 2,
      event: "Youth Service", 
      date: "2024-09-01",
      role: "Sound Tech",
      volunteers: ["David Wilson"],
      needed: 2,
      filled: 1
    },
    {
      id: 3,
      event: "Easter Service",
      date: "2024-09-08",
      role: "Greeter",
      volunteers: ["Sarah Brown", "Michael Davis", "Lisa Johnson"],
      needed: 6,
      filled: 3
    }
  ];

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsEditRoleModalOpen(true);
  };

  const handleManageAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsManageAssignmentModalOpen(true);
  };

  const handleSaveRole = (roleData: any) => {
    if (selectedRole) {
      // Update existing role
      setVolunteerRoles(prev => prev.map(role => 
        role.id === selectedRole.id ? { ...roleData, id: selectedRole.id } : role
      ));
    } else {
      // Add new role
      setVolunteerRoles(prev => [...prev, roleData]);
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
              <div className="text-2xl font-bold text-foreground">45</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volunteer Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{volunteerRoles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">18</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">7</div>
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
                  <Button variant="outline" className="gap-2" onClick={() => setIsAddRoleModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {volunteerRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          {role.activeCount} volunteers
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                      {upcomingAssignments.map((assignment) => (
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
                            <Button variant="ghost" size="sm" onClick={() => handleManageAssignment(assignment)}>
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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