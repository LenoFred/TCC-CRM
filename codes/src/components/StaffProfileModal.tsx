import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Calendar, Shield, Settings, Check } from "lucide-react";
import { StaffPermissionsModal } from "./StaffPermissionsModal";
import { api } from "@/config/api";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  jobTitle?: string;
  appointmentDate?: string;
  lastLogin?: string;
  updatedAt?: string;
  permissionCount: number;
}

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (staff: StaffMember) => void;
  staffMember: StaffMember | null;
}

export function StaffProfileModal({ isOpen, onClose, onEdit, staffMember }: StaffProfileModalProps) {
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [grantedPermissions, setGrantedPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  useEffect(() => {
    if (isOpen && staffMember) {
      fetchGrantedPermissions();
    }
  }, [isOpen, staffMember]);

  const fetchGrantedPermissions = async () => {
    if (!staffMember) return;
    
    setIsLoadingPermissions(true);
    try {
      const response = await api.staffPermissions.getByStaffId(staffMember.id.toString());
      const granted = response.permissions.filter((p: any) => p.granted);
      const groupPermissions = response.groupPermissions || [];
      
      // Add group permissions as special permission entries for display
      const groupPerms = groupPermissions.map((groupId: string) => ({
        key: groupId,
        label: `Group Access: ${groupId}`,
        category: 'Group Access',
        granted: true
      }));
      
      setGrantedPermissions([...granted, ...groupPerms]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setGrantedPermissions([]);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  if (!staffMember) return null;

  const handleEditProfile = () => {
    onEdit(staffMember);
    onClose();
  };

  const handlePermissionsSaved = (updatedStaff: any) => {
    // Refresh permissions list
    fetchGrantedPermissions();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                {staffMember.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{staffMember.name}</h3>
                <p className="text-sm text-muted-foreground">{staffMember.role || 'Staff Member'}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              View and manage staff member profile, permissions, and account details
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="font-medium">{staffMember.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <Badge variant={staffMember.status === 'Active' ? 'default' : 'secondary'}>
                        {staffMember.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <p className="font-medium">{staffMember.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <p className="font-medium">{staffMember.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Role & Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Staff Role</Label>
                      <p className="font-medium">{staffMember.role || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Job Title</Label>
                      <p className="font-medium">{staffMember.jobTitle || staffMember.role || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Appointment Date
                      </Label>
                      <p className="font-medium">{staffMember.appointmentDate || 'Not recorded'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Last Login</Label>
                      <p className="font-medium text-xs">
                        {staffMember.lastLogin ? new Date(staffMember.lastLogin).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                    <p className="font-medium text-xs">
                      {staffMember.updatedAt ? new Date(staffMember.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Current Permissions</p>
                      <p className="text-sm text-muted-foreground">
                        This staff member has {grantedPermissions.length} permissions assigned
                      </p>
                    </div>
                    <Button onClick={() => setIsPermissionsModalOpen(true)}>
                      Manage Permissions
                    </Button>
                  </div>
                  
                  {isLoadingPermissions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : grantedPermissions.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {grantedPermissions.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="mt-0.5">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{permission.label}</p>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {permission.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No permissions assigned yet</p>
                      <p className="text-sm">Click "Manage Permissions" to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <StaffPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        onSave={handlePermissionsSaved}
        staffMember={staffMember}
      />
    </>
  );
}