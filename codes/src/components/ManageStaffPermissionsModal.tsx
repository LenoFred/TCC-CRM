import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface ManageStaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPermissions: string[];
  onUpdate: (permissions: string[]) => void;
}

const availablePermissions: Permission[] = [
  // Members
  { key: "can_view_members", label: "View Members", description: "Can view member profiles and information" },
  { key: "can_edit_members", label: "Edit Members", description: "Can create, edit and delete member profiles" },
  
  // Donations
  { key: "can_view_donations", label: "View Donations", description: "Can view donation records and history" },
  { key: "can_verify_donations", label: "Verify Donations", description: "Can verify and process pending donations" },
  
  // Attendance
  { key: "can_view_attendance", label: "View Attendance", description: "Can view attendance records" },
  { key: "can_take_attendance", label: "Take Attendance", description: "Can mark attendance for events and groups" },
  
  // Volunteers
  { key: "can_view_volunteers", label: "View Volunteers", description: "Can view volunteer information" },
  { key: "can_manage_volunteers", label: "Manage Volunteers", description: "Can create and manage volunteer assignments" },
  
  // Communications
  { key: "can_communicate", label: "Send Communications", description: "Can send bulk messages to members" },
  
  // Reports & Analytics
  { key: "can_generate_reports", label: "Generate Reports", description: "Can view analytics and export reports" },
  
  // Staff Management
  { key: "can_view_staff", label: "View Staff", description: "Can view staff accounts" },
  { key: "can_manage_staff", label: "Manage Staff", description: "Can manage staff accounts and permissions" },
  
  // Settings
  { key: "can_manage_settings", label: "Manage Settings", description: "Can modify system settings and configurations" },
  
  // Events
  { key: "can_view_events", label: "View Events", description: "Can view church events" },
  { key: "can_manage_events", label: "Manage Events", description: "Can create and manage church events" }
];

export function ManageStaffPermissionsModal({ 
  isOpen, 
  onClose, 
  selectedPermissions,
  onUpdate 
}: ManageStaffPermissionsModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedPermissions);
    }
  }, [isOpen, selectedPermissions]);

  const handleToggle = (permissionKey: string) => {
    setTempSelected(prev => 
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSelectAll = () => {
    setTempSelected(availablePermissions.map(p => p.key));
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleSave = () => {
    onUpdate(tempSelected);
    onClose();
  };

  const handleCancel = () => {
    setTempSelected(selectedPermissions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Permissions
            </DialogTitle>
            <Badge variant={tempSelected.length > 0 ? "default" : "secondary"}>
              {tempSelected.length} / {availablePermissions.length}
            </Badge>
          </div>
          <DialogDescription>
            Select the permissions this staff member should have
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            {availablePermissions.map((permission) => {
              const isChecked = tempSelected.includes(permission.key);
              return (
                <div
                  key={permission.key}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent ${
                    isChecked ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => handleToggle(permission.key)}
                >
                  <Checkbox
                    id={permission.key}
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(permission.key)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={permission.key}
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                    >
                      {permission.label}
                      {isChecked && <Check className="h-3 w-3 text-primary" />}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {permission.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
