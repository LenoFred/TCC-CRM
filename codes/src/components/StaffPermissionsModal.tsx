import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  permissionCount: number;
  permissions?: string[];
}

interface StaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: StaffMember) => void;
  staffMember: StaffMember | null;
}

const AVAILABLE_PERMISSIONS = [
  { key: "can_view_members", label: "View Members", description: "Access to member profiles and lists" },
  { key: "can_edit_members", label: "Edit Members", description: "Create and modify member information" },
  { key: "can_view_donations", label: "View Donations", description: "Access to donation records" },
  { key: "can_verify_donations", label: "Verify Donations", description: "Verify and approve donations" },
  { key: "can_take_attendance", label: "Take Attendance", description: "Check-in members at events" },
  { key: "can_manage_volunteers", label: "Manage Volunteers", description: "Schedule and manage volunteers" },
  { key: "can_communicate", label: "Send Communications", description: "Send bulk messages to members" },
  { key: "can_view_analytics", label: "View Analytics", description: "Access to reports and analytics" },
  { key: "can_manage_staff", label: "Manage Staff", description: "Add/edit staff and permissions" },
  { key: "can_access_settings", label: "System Settings", description: "Configure system settings" }
];

export const StaffPermissionsModal = ({ isOpen, onClose, onSave, staffMember }: StaffPermissionsModalProps) => {
  const { toast } = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (staffMember && isOpen) {
      // Mock permissions based on staff member for demo
      const mockPermissions = staffMember.id === 1 ? 
        ['can_view_members', 'can_edit_members', 'can_manage_staff'] : 
        ['can_view_members'];
      setSelectedPermissions(mockPermissions);
    } else {
      setSelectedPermissions([]);
    }
  }, [staffMember, isOpen]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const handleSave = () => {
    if (!staffMember) return;

    const updatedStaffMember: StaffMember = {
      ...staffMember,
      permissions: selectedPermissions
    };

    onSave(updatedStaffMember);

    toast({
      title: "Permissions Updated",
      description: `${staffMember.name}'s permissions have been updated successfully.`,
    });

    onClose();
  };

  if (!staffMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Staff Permissions
          </DialogTitle>
          <DialogDescription>
            Configure access permissions for {staffMember.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Staff Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{staffMember.name}</h3>
                <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                <Badge variant="outline" className="mt-1">{staffMember.role}</Badge>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-base font-medium mb-4 block">System Permissions</Label>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission.key}
                    checked={selectedPermissions.includes(permission.key)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.key, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor={permission.key} className="font-medium cursor-pointer">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Permissions Summary */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Label className="text-sm font-medium text-primary">
              Selected Permissions ({selectedPermissions.length})
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedPermissions.length > 0 ? (
                selectedPermissions.map((perm) => {
                  const permission = AVAILABLE_PERMISSIONS.find(p => p.key === perm);
                  return (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {permission?.label}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No permissions selected</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};