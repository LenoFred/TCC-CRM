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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Check, X, ChevronDown, ChevronRight, Users } from "lucide-react";
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
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Array<{ groupID: string; groupName: string }>>([]);
  const [staffGroupPermissions, setStaffGroupPermissions] = useState<string>("");

  useEffect(() => {
    if (staffMember && isOpen) {
      fetchPermissions();
      fetchGroups();
    }
  }, [staffMember, isOpen]);

  const fetchGroups = async () => {
    try {
      // Use special endpoint that doesn't require can_view_groups permission
      const response = await api.groups.getForPermissions();
      setAvailableGroups(response.data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchPermissions = async () => {
    if (!staffMember) return;
    
    setIsLoading(true);
    try {
      const response = await api.staffPermissions.getByStaffId(staffMember.id.toString());
      setPermissions(response.permissions);
      
      // Load group permissions from response
      if (response.groupPermissions && Array.isArray(response.groupPermissions)) {
        setSelectedGroupIds(response.groupPermissions);
        setStaffGroupPermissions(response.groupPermissions.join(','));
      } else {
        setSelectedGroupIds([]);
        setStaffGroupPermissions("");
      }
      
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
      
      // Open first section by default
      const categories = Object.keys(grouped);
      if (categories.length > 0) {
        setOpenSections([categories[0]]);
      }
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

  const toggleSection = (category: string) => {
    setOpenSections(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategorySelectedCount = (category: string) => {
    const categoryPermissions = groupedPermissions[category] || [];
    return categoryPermissions.filter(p => selectedPermissions.has(p.key)).length;
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

  const handleSelectNone = (category: string) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const categoryKeys = categoryPermissions.map(p => p.key);
    
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      categoryKeys.forEach(key => newSet.delete(key));
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

    // Validate: If groups are selected in Group Access Permissions, at least one Groups permission must be selected
    if (selectedGroupIds.length > 0) {
      const groupPermissions = ['can_view_groups', 'can_add_groups', 'can_edit_groups', 'can_delete_groups'];
      const hasGroupPermission = groupPermissions.some(perm => selectedPermissions.has(perm));
      
      if (!hasGroupPermission) {
        toast({
          title: "Invalid Permission Configuration",
          description: "You have selected groups in Group Access Permissions but no Groups permissions are enabled. Please select at least one permission from: Can view groups, Can create groups, Can modify groups, or Can remove groups.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Save both regular permissions and group permissions to StaffPermissions sheet
      await api.staffPermissions.update(staffMember.id.toString(), {
        permissions: Array.from(selectedPermissions),
        groupPermissions: selectedGroupIds
      });

      const updatedStaffMember: StaffMember = {
        ...staffMember,
        permissionCount: selectedPermissions.size,
        permissions: Array.from(selectedPermissions),
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
              <div className="space-y-3">
                {Object.keys(groupedPermissions).sort().map(category => {
                  const categoryPerms = groupedPermissions[category];
                  const selectedCount = getCategorySelectedCount(category);
                  const totalCount = categoryPerms.length;
                  const isOpen = openSections.includes(category);

                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div className="bg-muted/50 p-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleSection(category)}
                            className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-semibold">{category}</span>
                            <Badge variant="outline" className="ml-2">
                              {selectedCount} of {totalCount}
                            </Badge>
                          </button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => handleSelectAll(category)}
                            >
                              All
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => handleSelectNone(category)}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Category Content */}
                      {isOpen && (
                        <div className="p-4 space-y-2">
                          {categoryPerms.map(permission => (
                            <div key={permission.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${category}-${permission.key}`}
                                checked={selectedPermissions.has(permission.key)}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(permission.key, checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`${category}-${permission.key}`}
                                className="flex-1 text-sm cursor-pointer leading-tight"
                              >
                                <span className="font-medium">{permission.name}</span>
                                {permission.description && (
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    {permission.description}
                                  </p>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Group Access Permissions */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Group Access Permissions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Restrict this staff member to only view and manage data for specific groups
                  </p>
                  
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !selectedGroupIds.includes(value)) {
                        setSelectedGroupIds(prev => [...prev, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select groups to restrict access..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGroups
                        .filter(group => !selectedGroupIds.includes(group.groupID))
                        .map((group) => (
                          <SelectItem key={group.groupID} value={group.groupID}>
                            {group.groupName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {selectedGroupIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedGroupIds.map(groupId => {
                        const group = availableGroups.find(g => g.groupID === groupId);
                        return (
                          <Badge key={groupId} variant="secondary" className="gap-1">
                            {group?.groupName || groupId}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => setSelectedGroupIds(prev => prev.filter(id => id !== groupId))}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  {selectedGroupIds.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No restrictions - staff can view all groups
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}