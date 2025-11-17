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
  const [selectedMember, setSelectedMember] = useState("");
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
      
      // Filter for active groups
      const activeGroups = groupsData.filter((g: any) => 
        g.status?.toLowerCase() === 'active'
      );
      
      setGroups(activeGroups);
      setRoles(rolesData);
      setMembers(membersData);
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
    if (!selectedGroup || !selectedRole || !selectedMember) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const assignmentData = {
        memberID: selectedMember,
        groupID: selectedGroup,
        roleID: selectedRole,
        assignmentStatus: "Scheduled",
      };

      await api.volunteers.createAssignment(assignmentData);

      toast({
        title: "Assignment Created",
        description: "Volunteer has been assigned successfully.",
      });

      // Reset form
      setSelectedGroup("");
      setSelectedRole("");
      setSelectedMember("");
      
      onSave(assignmentData);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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
            <Label htmlFor="member">Assign Member *</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No members found
                  </div>
                ) : (
                  members.map((member: any) => (
                    <SelectItem key={member.memberID} value={member.memberID}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Badge */}
          {selectedGroup && selectedRole && selectedMember && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs text-muted-foreground">Assignment Preview</Label>
              <div className="mt-2 space-y-1">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {groups.find((g: any) => g.groupID === selectedGroup)?.groupName}
                  </Badge>
                  <Badge variant="outline">
                    {roles.find((r: any) => r.roleID === selectedRole)?.roleName}
                  </Badge>
                </div>
                <p className="text-sm">
                  {members.find((m: any) => m.memberID === selectedMember)?.firstName}{' '}
                  {members.find((m: any) => m.memberID === selectedMember)?.lastName}
                </p>
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