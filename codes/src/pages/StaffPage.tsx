import { useState, useEffect } from "react";
import { Users, Shield, Settings, UserPlus, Eye, Edit2, AlertCircle, RefreshCw } from "lucide-react";
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
import { AddEditStaffModal } from "@/components/AddEditStaffModal";
import { StaffProfileModal } from "@/components/StaffProfileModal";
import { useToast } from "@/hooks/use-toast";

const StaffPage = () => {
  const { toast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffError, setStaffError] = useState(null);

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    setStaffError(null);
    try {
      const response: any = await api.staff.getAll();
      console.log('Staff data received:', response);
      // Handle response format - could be array or { success, data }
      const staffData = response?.data || response || [];
      
      // Transform backend field names to frontend field names
      const transformedStaff = (Array.isArray(staffData) ? staffData : []).map((staff: any) => ({
        ...staff,
        id: staff.staffID || staff.id,
        name: staff.fullName || staff.name,
        role: staff.staffRole || staff.role,
        phone: staff.phoneNumber || staff.phone,
      }));

      // Fetch permission counts for each staff member
      const staffWithPermissions = await Promise.all(
        transformedStaff.map(async (staff: any) => {
          try {
            const permResponse = await api.staffPermissions.getByStaffId(staff.id.toString());
            return {
              ...staff,
              permissionCount: permResponse.total || 0,
            };
          } catch (error) {
            console.error(`Error fetching permissions for staff ${staff.id}:`, error);
            return {
              ...staff,
              permissionCount: 0,
            };
          }
        })
      );
      
      setStaffMembers(staffWithPermissions);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaffError(error.message || 'Failed to load staff members');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const handleAddStaff = async (staffData: any) => {
    setIsSavingStaff(true);
    try {
      await api.staff.create(staffData);
      // Refresh the staff list from backend to get updated data with correct field names
      await fetchStaff();
      toast({
        title: "Staff Member Added",
        description: `${staffData.name} has been successfully added`,
      });
      setIsAddStaffModalOpen(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Failed to Add Staff",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive",
      });
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleEditStaff = async (staffData: any) => {
    setIsSavingStaff(true);
    console.log('📤 Sending staff update:', staffData);
    try {
      const updatedStaff = await api.staff.update(staffData.id, staffData);
      // Refresh the staff list from backend to get updated data
      await fetchStaff();
      toast({
        title: "Staff Member Updated",
        description: `${staffData.name}'s profile has been successfully updated`,
      });
      setIsEditStaffModalOpen(false);
      setEditingStaff(null);
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Failed to Update Staff",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive",
      });
    } finally {
      setIsSavingStaff(false);
    }
  };

  const openProfileModal = (staff: any) => {
    // Data is already transformed in fetchStaff, just pass it through
    setSelectedStaff(staff);
    setIsProfileModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    // Data is already transformed in fetchStaff, just pass it through
    setEditingStaff(staff);
    setIsEditStaffModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Staff Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage staff accounts and permissions</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsAddStaffModalOpen(true)} disabled={isLoadingStaff}>
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
              {isLoadingStaff ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{staffMembers.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {staffMembers.filter((s: any) => s.status === 'Active' || !s.status).length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Logged In Today</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">2</div>
              )}
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Staff Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Permissions</TableHead>
                    <TableHead className="hidden xl:table-cell">Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingStaff ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : staffError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Staff Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between">
                            <span>{staffError}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchStaff}
                              disabled={isLoadingStaff}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : staffMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffMembers.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name || staff.email || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{staff.email || 'N/A'}</TableCell>
                        <TableCell>{staff.role || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={staff.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
                          >
                            {staff.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="font-semibold">
                            {staff.permissionCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {staff.lastLogin ? new Date(staff.lastLogin).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openProfileModal(staff)}
                            disabled={isSavingStaff}
                          >
                            <Eye className="h-4 w-4" />
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