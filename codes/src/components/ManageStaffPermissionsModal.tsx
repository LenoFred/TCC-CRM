import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/config/api";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

interface ManageStaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPermissions: string[];
  onUpdate: (permissions: string[], groupPermissions?: string[]) => void;
  groupPermissions?: string[];
  userRole?: string;
  staffName?: string;
}

const permissionCategories: PermissionCategory[] = [
  {
    name: "Members",
    permissions: [
      { key: "can_view_members", label: "View Members", description: "Can view member profiles and information" },
      { key: "can_edit_members", label: "Edit Members", description: "Can create, edit and delete member profiles" },
    ]
  },
  {
    name: "Families",
    permissions: [
      { key: "can_view_families", label: "View Families", description: "Can view family information" },
      { key: "can_manage_families", label: "Manage Families", description: "Can create and manage family units" },
    ]
  },
  {
    name: "Donations",
    permissions: [
      { key: "can_view_donations", label: "View Donations", description: "Can view donation records and history" },
      { key: "can_verify_donations", label: "Verify Donations", description: "Can verify and process pending donations" },
    ]
  },
  {
    name: "Attendance",
    permissions: [
      { key: "can_view_attendance", label: "View Attendance", description: "Can view attendance records" },
      { key: "can_take_attendance", label: "Take Attendance", description: "Can mark attendance for events and groups" },
    ]
  },
  {
    name: "Volunteers",
    permissions: [
      { key: "can_view_volunteers", label: "View Volunteers", description: "Can view volunteer information" },
      { key: "can_manage_volunteers", label: "Manage Volunteers", description: "Can create and manage volunteer assignments" },
    ]
  },
  {
    name: "Communications",
    permissions: [
      { key: "can_communicate", label: "Send Communications", description: "Can send bulk messages to members" },
    ]
  },
  {
    name: "Reports & Analytics",
    permissions: [
      { key: "can_generate_reports", label: "Generate Reports", description: "Can view analytics and export reports" },
    ]
  },
  {
    name: "Staff Management",
    permissions: [
      { key: "can_view_staff", label: "View Staff", description: "Can view staff accounts" },
      { key: "can_manage_staff", label: "Manage Staff", description: "Can manage staff accounts and permissions" },
    ]
  },
  {
    name: "Settings",
    permissions: [
      { key: "can_manage_settings", label: "Manage Settings", description: "Can modify system settings and configurations" },
    ]
  },
  {
    name: "Events",
    permissions: [
      { key: "can_view_events", label: "View Events", description: "Can view church events" },
      { key: "can_manage_events", label: "Manage Events", description: "Can create and manage church events" },
    ]
  }
];

export function ManageStaffPermissionsModal({ 
  isOpen, 
  onClose, 
  selectedPermissions,
  onUpdate,
  groupPermissions = [],
  userRole = "Staff",
  staffName = "staff member"
}: ManageStaffPermissionsModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(["Members", "Attendance"]);
  const [availableGroups, setAvailableGroups] = useState<Array<{ groupID: string; groupName: string }>>([]);

  // Fetch available groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.groups.getForPermissions();
        setAvailableGroups(response.data || []);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedPermissions);
      setSelectedGroupIds(groupPermissions);
    }
  }, [isOpen, selectedPermissions, groupPermissions]);

  const handleToggle = (permissionKey: string) => {
    setTempSelected(prev => 
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleCategoryAll = (categoryName: string) => {
    const category = permissionCategories.find(c => c.name === categoryName);
    if (category) {
      const categoryKeys = category.permissions.map(p => p.key);
      setTempSelected(prev => {
        const withoutCategory = prev.filter(key => !categoryKeys.includes(key));
        return [...withoutCategory, ...categoryKeys];
      });
    }
  };

  const handleCategoryNone = (categoryName: string) => {
    const category = permissionCategories.find(c => c.name === categoryName);
    if (category) {
      const categoryKeys = category.permissions.map(p => p.key);
      setTempSelected(prev => prev.filter(key => !categoryKeys.includes(key)));
    }
  };

  const getCategorySelectedCount = (categoryName: string) => {
    const category = permissionCategories.find(c => c.name === categoryName);
    if (!category) return 0;
    const categoryKeys = category.permissions.map(p => p.key);
    return tempSelected.filter(key => categoryKeys.includes(key)).length;
  };

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const getTotalSelectedCount = () => {
    return tempSelected.length;
  };

  const getTotalPermissionsCount = () => {
    return permissionCategories.reduce((sum, cat) => sum + cat.permissions.length, 0);
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleSave = () => {
    onUpdate(tempSelected, selectedGroupIds);
    onClose();
  };

  const handleCancel = () => {
    setTempSelected(selectedPermissions);
    setSelectedGroupIds(groupPermissions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Manage Staff Permissions
              </DialogTitle>
              <DialogDescription className="mt-1">
                Configure access permissions for {staffName}
              </DialogDescription>
            </div>
            <Badge variant={getTotalSelectedCount() > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {getTotalSelectedCount()}
              <span className="text-xs ml-1 opacity-70">Permissions</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          {/* Group Permissions - Only for Staff (not Admin) */}
          {userRole === "Staff" && (
            <div className="border rounded-lg p-4 bg-muted/50 mb-4">
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

          {/* Permission Categories */}
          <div className="space-y-3">
            {permissionCategories.map((category) => {
              const isOpen = openSections.includes(category.name);
              const selectedCount = getCategorySelectedCount(category.name);
              const totalCount = category.permissions.length;
              const allSelected = selectedCount === totalCount;

              return (
                <div key={category.name} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleSection(category.name)}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1" onClick={() => toggleSection(category.name)} className="cursor-pointer">
                        <h3 className="font-semibold text-sm">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedCount} of {totalCount} selected
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={allSelected ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleCategoryAll(category.name)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        All
                      </Button>
                      <Button
                        type="button"
                        variant={selectedCount === 0 ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleCategoryNone(category.name)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        None
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-3 space-y-2">
                      {category.permissions.map((permission) => {
                        const isChecked = tempSelected.includes(permission.key);
                        return (
                          <div
                            key={permission.key}
                            className={`flex items-start space-x-3 p-2 rounded-md transition-all cursor-pointer hover:bg-accent ${
                              isChecked ? 'bg-primary/5' : ''
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
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
