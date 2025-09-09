import { useState } from "react";
import { Users, Shield, Settings, UserPlus, Eye, Edit2 } from "lucide-react";
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
import { AddEditStaffModal } from "@/components/AddEditStaffModal";
import { StaffProfileModal } from "@/components/StaffProfileModal";

const StaffPage = () => {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Mock data
  const [staffMembers, setStaffMembers] = useState([
    {
      id: 1,
      name: "Pastor John Smith",
      email: "pastor.john@unitychurch.com",
      role: "Senior Pastor",
      status: "Active",
      lastLogin: "2024-08-30",
      permissionCount: 12,
      phone: "+1 234-567-8900",
      jobTitle: "Senior Pastor",
      appointmentDate: "2010-01-15"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@unitychurch.com",
      role: "Administrative Assistant",
      status: "Active",
      lastLogin: "2024-08-30",
      permissionCount: 8,
      phone: "+1 234-567-8901",
      jobTitle: "Administrative Assistant",
      appointmentDate: "2015-06-20"
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.b@unitychurch.com",
      role: "Youth Pastor",
      status: "Active",
      lastLogin: "2024-08-29",
      permissionCount: 6,
      phone: "+1 234-567-8902",
      jobTitle: "Youth Pastor",
      appointmentDate: "2018-03-10"
    },
    {
      id: 4,
      name: "Lisa Davis",
      email: "lisa.d@unitychurch.com",
      role: "Worship Leader",
      status: "Active",
      lastLogin: "2024-08-28",
      permissionCount: 4,
      phone: "+1 234-567-8903",
      jobTitle: "Worship Leader",
      appointmentDate: "2020-09-01"
    }
  ]);

  const availablePermissions = [
    { key: "can_view_members", label: "View Members", description: "Can view member profiles and information" },
    { key: "can_edit_members", label: "Edit Members", description: "Can create and modify member profiles" },
    { key: "can_view_donations", label: "View Donations", description: "Can view donation records and history" },
    { key: "can_verify_donations", label: "Verify Donations", description: "Can verify and process pending donations" },
    { key: "can_take_attendance", label: "Take Attendance", description: "Can mark attendance for events and groups" },
    { key: "can_manage_volunteers", label: "Manage Volunteers", description: "Can schedule and manage volunteer assignments" },
    { key: "can_communicate", label: "Send Communications", description: "Can send bulk messages to members" },
    { key: "can_generate_reports", label: "Generate Reports", description: "Can create and export analytics reports" },
    { key: "can_manage_staff", label: "Manage Staff", description: "Can manage staff accounts and permissions" },
    { key: "can_manage_settings", label: "Manage Settings", description: "Can modify system settings and configurations" },
    { key: "can_export_data", label: "Export Data", description: "Can export member lists and reports" },
    { key: "can_manage_events", label: "Manage Events", description: "Can create and manage church events" }
  ];

  const handleAddStaff = (staffData: any) => {
    setStaffMembers([...staffMembers, staffData]);
  };

  const handleEditStaff = (staffData: any) => {
    setStaffMembers(staffMembers.map(staff => 
      staff.id === staffData.id ? staffData : staff
    ));
  };

  const openProfileModal = (staff: any) => {
    setSelectedStaff(staff);
    setIsProfileModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    setEditingStaff(staff);
    setIsEditStaffModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground">Manage staff accounts and permissions</p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddStaffModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{staffMembers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{staffMembers.filter(s => s.status === 'Active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Logged In Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Permission Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{availablePermissions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{staff.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {staff.permissionCount} permissions
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openProfileModal(staff)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(staff)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Staff Modal */}
        <AddEditStaffModal
          isOpen={isAddStaffModalOpen}
          onClose={() => setIsAddStaffModalOpen(false)}
          onSave={handleAddStaff}
          mode="add"
        />

        {/* Edit Staff Modal */}
        <AddEditStaffModal
          isOpen={isEditStaffModalOpen}
          onClose={() => {
            setIsEditStaffModalOpen(false);
            setEditingStaff(null);
          }}
          onSave={handleEditStaff}
          staffMember={editingStaff}
          mode="edit"
        />

        {/* Staff Profile Modal */}
        <StaffProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedStaff(null);
          }}
          onEdit={openEditModal}
          staffMember={selectedStaff}
        />
      </div>
    </DashboardLayout>
  );
};

export default StaffPage;