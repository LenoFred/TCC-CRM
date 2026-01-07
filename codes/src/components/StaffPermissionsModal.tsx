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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, User, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

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

interface Permission {
  key: string;
  label: string;
  category: string;
  description: string;
  granted: boolean;
}

interface StaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: StaffMember) => void;
  staffMember: StaffMember | null;
}

export const StaffPermissionsModal = ({ isOpen, onClose, onSave, staffMember }: StaffPermissionsModalProps) => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});

  useEffect(() => {
    if (staffMember && isOpen) {
      fetchPermissions();
    }
  }, [staffMember, isOpen]);

  const fetchPermissions = async () => {
    if (!staffMember) return;
    
    setIsLoading(true);
    try {
      const response = await api.staffPermissions.getByStaffId(staffMember.id.toString());
      setPermissions(response.permissions);
      
      // Group permissions by category
      const grouped = response.permissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
      }, {});
      setGroupedPermissions(grouped);

      // Set initially selected permissions
      const granted = new Set(
        response.permissions
          .filter((p: Permission) => p.granted)
          .map((p: Permission) => p.key)
      );
      setSelectedPermissions(granted);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Failed to Load Permissions",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(permission);
      } else {
        newSet.delete(permission);
      }
      return newSet;
    });
  };

  const handleSelectAll = (category: string) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const categoryKeys = categoryPermissions.map(p => p.key);
    
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      categoryKeys.forEach(key => newSet.add(key));
      return newSet;
    });
  };

  const handleDeselectAll = (category: string) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const categoryKeys = categoryPermissions.map(p => p.key);
    
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      categoryKeys.forEach(key => newSet.delete(key));
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!staffMember) return;

    setIsSaving(true);
    try {
      await api.staffPermissions.update(staffMember.id.toString(), Array.from(selectedPermissions));
      
      const updatedStaffMember: StaffMember = {
        ...staffMember,
        permissionCount: selectedPermissions.size,
        permissions: Array.from(selectedPermissions)
      };

      onSave(updatedStaffMember);

      toast({
        title: "Permissions Updated",
        description: `${staffMember.name}'s permissions have been updated successfully.`,
      });

      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Failed to Update Permissions",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!staffMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Staff Permissions
          </DialogTitle>
          <DialogDescription>
            Configure access permissions for {staffMember.name}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
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
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{selectedPermissions.size}</p>
                    <p className="text-xs text-muted-foreground">Permissions</p>
                  </div>
                </div>
              </div>

              {/* Permissions by Category */}
              {Object.keys(groupedPermissions).sort().map(category => {
                const categoryPerms = groupedPermissions[category];
                const allSelected = categoryPerms.every(p => selectedPermissions.has(p.key));
                const someSelected = categoryPerms.some(p => selectedPermissions.has(p.key));

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-base">{category}</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSelectAll(category)}
                          disabled={allSelected}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeselectAll(category)}
                          disabled={!someSelected}
                        >
                          <X className="h-3 w-3 mr-1" />
                          None
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {categoryPerms.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={permission.key}
                            checked={selectedPermissions.has(permission.key)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.key, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={permission.key} className="font-medium cursor-pointer">
                              {permission.label}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};