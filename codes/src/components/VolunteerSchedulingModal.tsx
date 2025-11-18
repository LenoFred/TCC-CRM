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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

interface VolunteerSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: any) => void;
}

export const VolunteerSchedulingModal = ({ isOpen, onClose, onSave }: VolunteerSchedulingModalProps) => {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [groupsResponse, rolesResponse, membersResponse]: any[] = await Promise.all([
        api.groups.getAll(),
        api.volunteers.getRoles(),
        api.members.getAll(),
      ]);
      
      const groupsData = groupsResponse?.data || groupsResponse || [];
      const rolesData = rolesResponse?.data || rolesResponse || [];
      const membersData = membersResponse?.data || membersResponse || [];
      
      console.log('All members from API:', membersData.length);
      
      // Filter for active groups
      const activeGroups = groupsData.filter((g: any) => 
        g.status?.toLowerCase() === 'active'
      );
      
      // Filter for active members only
      const activeMembers = membersData.filter((m: any) => {
        const isActive = m.status?.toLowerCase() === 'active';
        return isActive;
      });
      
      console.log('Active members filtered:', activeMembers.length);
      
      setGroups(activeGroups);
      setRoles(rolesData);
      setMembers(activeMembers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGroup || !selectedRole || selectedMembers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select event, role, and at least one volunteer.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create assignment for each selected member
      const assignmentPromises = selectedMembers.map(memberID => 
        api.volunteers.createAssignment({
          memberID,
          groupID: selectedGroup,
          roleID: selectedRole,
          assignmentStatus: "Scheduled",
        })
      );

      await Promise.all(assignmentPromises);

      toast({
        title: "Assignments Created",
        description: `${selectedMembers.length} volunteer(s) assigned successfully.`,
      });

      // Reset form
      setSelectedGroup("");
      setSelectedRole("");
      setSelectedMembers([]);
      
      onSave({ selectedMembers });
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (memberID: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberID)
        ? prev.filter(id => id !== memberID)
        : [...prev, memberID]
    );
  };

  const removeMember = (memberID: string) => {
    setSelectedMembers(prev => prev.filter(id => id !== memberID));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Volunteer Schedule</DialogTitle>
          <DialogDescription>
            Assign a volunteer to a role for a specific event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event/Group Selection */}
          <div>
            <Label htmlFor="group">Select Event *</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {groups.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No active events found
                  </div>
                ) : (
                  groups.map((group: any) => (
                    <SelectItem key={group.groupID} value={group.groupID}>
                      <div className="flex flex-col">
                        <span>{group.groupName || 'Unnamed Event'}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.groupType && `Type: ${group.groupType}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div>
            <Label htmlFor="role">Select Volunteer Role *</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No volunteer roles found
                  </div>
                ) : (
                  roles.map((role: any) => (
                    <SelectItem key={role.roleID} value={role.roleID}>
                      {role.roleName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Member Selection */}
          <div>
            <Label htmlFor="member">Select Volunteers * (choose one or more)</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {members.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No active members found
                </div>
              ) : (
                members.map((member: any) => (
                  <div 
                    key={member.memberID} 
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => toggleMember(member.memberID)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.memberID)}
                      onChange={() => toggleMember(member.memberID)}
                      className="h-4 w-4 cursor-pointer"
                      disabled={isLoading}
                    />
                    <label className="flex-1 cursor-pointer text-sm">
                      {member.firstName} {member.lastName}
                      {member.phoneNumber && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({member.phoneNumber})
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
            {selectedMembers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedMembers.length} volunteer(s) selected
              </p>
            )}
          </div>

          {/* Preview Section */}
          {selectedGroup && selectedRole && selectedMembers.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs text-muted-foreground">Assignment Preview</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {groups.find((g: any) => g.groupID === selectedGroup)?.groupName}
                  </Badge>
                  <Badge variant="outline">
                    {roles.find((r: any) => r.roleID === selectedRole)?.roleName}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Selected Volunteers:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMembers.map((memberID) => {
                      const member = members.find((m: any) => m.memberID === memberID);
                      return (
                        <Badge 
                          key={memberID} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {member?.firstName} {member?.lastName}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMember(memberID);
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Assign Volunteer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};