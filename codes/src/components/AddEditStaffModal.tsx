import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ManageStaffPermissionsModal } from "@/components/ManageStaffPermissionsModal";
import { api } from "@/config/api";

interface StaffMember {
  id?: number;
  name: string;
  email: string;
  role: string; // Job title (Pastor, Secretary, etc.)
  userRole?: string; // Access level (Admin/Staff)
  status: string;
  phone?: string;
  jobTitle?: string;
  appointmentDate?: string;
  lastLogin: string;
  permissionCount: number;
  username?: string;
  password?: string;
  permissions?: string[];
  groupPermissions?: string | string[]; // Can be comma-separated string or array
}

interface AddEditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: StaffMember) => void;
  staffMember?: StaffMember | null;
  mode: 'add' | 'edit';
}

export function AddEditStaffModal({ isOpen, onClose, onSave, staffMember, mode }: AddEditStaffModalProps) {
  const { toast } = useToast();
  
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Array<{ groupID: string; groupName: string }>>([]);

  // Fetch available groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.groups.getForPermissions();
        console.log('Fetched groups:', response.data);
        setAvailableGroups(response.data || []);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  // Initialize form data when modal opens or staffMember changes
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: "",
    email: "",
    role: "",
    userRole: "Staff", // Default to Staff
    status: "Active",
    phone: "",
    jobTitle: "",
    appointmentDate: "",
    username: "",
    password: "",
  });

  // Fetch group permissions from StaffPermissions sheet
  const fetchGroupPermissions = async (staffId: number) => {
    try {
      const response = await api.staffPermissions.getByStaffId(staffId.toString());
      if (response.groupPermissions && Array.isArray(response.groupPermissions)) {
        setSelectedGroupIds(response.groupPermissions);
      } else {
        setSelectedGroupIds([]);
      }
    } catch (error) {
      console.error('Failed to fetch group permissions:', error);
      setSelectedGroupIds([]);
    }
  };

  // Update form data when staffMember changes
  useEffect(() => {
    if (staffMember && mode === 'edit') {
      setFormData({
        name: staffMember.name || "",
        email: staffMember.email || "",
        role: staffMember.role || "",
        userRole: staffMember.userRole || "Staff",
        status: staffMember.status || "Active",
        phone: staffMember.phone || "",
        jobTitle: staffMember.jobTitle || "",
        appointmentDate: staffMember.appointmentDate || "",
        username: staffMember.username || "",
        password: "", // Never pre-fill password for security
      });
      setTempPermissions(staffMember.permissions || []);
      // Fetch group permissions from StaffPermissions sheet
      fetchGroupPermissions(staffMember.id);
    } else if (mode === 'add') {
      setFormData({
        name: "",
        email: "",
        role: "",
        userRole: "Staff",
        status: "Active",
        phone: "",
        jobTitle: "",
        appointmentDate: "",
        username: "",
        password: "",
      });
      setTempPermissions([]);
      setSelectedGroupIds([]);
    }
  }, [staffMember, mode, isOpen]);

  const handleSave = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Name, Email, and Staff Role",
        variant: "destructive",
      });
      return;
    }

    // Only validate username/password for new staff
    if (mode === 'add') {
      if (!formData.username || !formData.password) {
        toast({
          title: "Missing Credentials",
          description: "Username and password are required for new staff",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      if (tempPermissions.length === 0) {
        toast({
          title: "No Permissions Selected",
          description: "Please assign at least one permission to this staff member",
          variant: "destructive",
        });
        return;
      }
    }

    // Include permissions and groupPermissions in the save data
    const staffData: StaffMember = {
      ...formData,
      permissions: tempPermissions,
      groupPermissions: selectedGroupIds, // Send as array for create/edit
      id: staffMember?.id || Date.now(),
    } as StaffMember;

    onSave(staffData);

    toast({
      title: mode === 'add' ? "Staff Added" : "Staff Updated",
      description: `${formData.name} has been ${mode === 'add' ? 'added' : 'updated'} successfully.`,
    });
    
    onClose();
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      role: "",
      userRole: "Staff",
      status: "Active",
      phone: "",
      jobTitle: "",
      appointmentDate: "",
      username: "",
      password: "",
    });
    setTempPermissions([]);
    setSelectedGroupIds([]);
  };

  const handlePermissionsUpdate = (permissions: string[], groupPerms?: string[]) => {
    setTempPermissions(permissions);
    if (groupPerms !== undefined) {
      setSelectedGroupIds(groupPerms);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Staff Member' : `Edit Staff: ${staffMember?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Create a new staff account with login credentials and permissions' : 'Update staff member information'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Staff Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senior Pastor">Senior Pastor</SelectItem>
                  <SelectItem value="Assistant Pastor">Assistant Pastor</SelectItem>
                  <SelectItem value="Youth Pastor">Youth Pastor</SelectItem>
                  <SelectItem value="Worship Leader">Worship Leader</SelectItem>
                  <SelectItem value="Administrative Assistant">Administrative Assistant</SelectItem>
                  <SelectItem value="Secretary">Secretary</SelectItem>
                  <SelectItem value="Treasurer">Treasurer</SelectItem>
                  <SelectItem value="Deacon">Deacon</SelectItem>
                  <SelectItem value="Elder">Elder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="userRole">Access Level *</Label>
              <Select value={formData.userRole} onValueChange={(value) => setFormData({ ...formData, userRole: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="Staff">Staff (Limited Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Group Permissions - Only for Staff (not Admin) */}
          {formData.userRole === "Staff" && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <Label className="text-sm font-medium mb-2 block">
                Group Access Permissions
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Leave empty for full access to all groups. Select specific groups to restrict access.
              </p>
              <Select
                value=""
                onValueChange={(groupId) => {
                  if (groupId && !selectedGroupIds.includes(groupId)) {
                    setSelectedGroupIds([...selectedGroupIds, groupId]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select groups to grant access..." />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups
                    .filter(g => !selectedGroupIds.includes(g.groupID))
                    .map(group => (
                      <SelectItem key={group.groupID} value={group.groupID}>
                        {group.groupName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedGroupIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedGroupIds.map(groupId => {
                    const group = availableGroups.find(g => g.groupID === groupId);
                    return (
                      <Badge key={groupId} variant="secondary" className="pl-2 pr-1">
                        {group?.groupName || groupId}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Enter job title"
              />
            </div>
            <div>
              <Label htmlFor="appointmentDate">Appointment Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              />
            </div>
          </div>

          {/* Login Credentials Section - Only show when adding new staff */}
          {mode === 'add' && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Login Credentials
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min. 6 characters"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permissions
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      At least one permission is required
                    </p>
                  </div>
                  <Badge variant={tempPermissions.length > 0 ? "default" : "secondary"}>
                    {tempPermissions.length} Selected
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPermissionsModal(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'add' ? 'Add Staff Member' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Permissions Modal */}
      <ManageStaffPermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        selectedPermissions={tempPermissions}
        onUpdate={handlePermissionsUpdate}
        groupPermissions={selectedGroupIds}
        userRole={formData.userRole}
        staffName={formData.name || "staff member"}
      />
    </Dialog>
  );
}