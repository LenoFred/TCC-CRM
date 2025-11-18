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
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");

  // Filter groups based on search query
  const filteredGroups = groups.filter((group: any) => {
    if (!groupSearchQuery.trim()) return false;
    const groupName = (group.groupName || '').toLowerCase();
    const groupType = (group.groupType || '').toLowerCase();
    const query = groupSearchQuery.toLowerCase();
    return groupName.includes(query) || groupType.includes(query);
  });

  // Filter members based on search query
  const filteredMembers = members.filter((member: any) => {
    if (!searchQuery.trim()) return false;
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

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
            <Label htmlFor="group">Search and Select Event *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="group"
                type="text"
                placeholder="Type event/group name to search..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            
            {/* Selected Event Display */}
            {selectedGroup && (
              <div className="mt-2">
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  {groups.find(g => g.groupID === selectedGroup)?.groupName || selectedGroup}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSelectedGroup('')}
                  />
                </Badge>
              </div>
            )}
            
            {/* Search Results */}
            {groupSearchQuery.trim() && !selectedGroup && (
              <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No events found matching "{groupSearchQuery}"
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredGroups.map((group: any) => (
                      <div 
                        key={group.groupID} 
                        className="flex items-start space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          setSelectedGroup(group.groupID);
                          setGroupSearchQuery('');
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{group.groupName || 'Unnamed Event'}</div>
                          {group.groupType && (
                            <div className="text-xs text-muted-foreground">Type: {group.groupType}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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

          {/* Member Selection with Search */}
          <div>
            <Label htmlFor="member">Search and Select Volunteers *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="member"
                type="text"
                placeholder="Type member name to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            
            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No members found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredMembers.map((member: any) => (
                      <div 
                        key={member.memberID} 
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          toggleMember(member.memberID);
                          setSearchQuery(""); // Clear search after selection
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.memberID)}
                          onChange={() => {
                            toggleMember(member.memberID);
                            setSearchQuery("");
                          }}
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
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Selected Members Display */}
            {selectedMembers.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {selectedMembers.length} volunteer(s) selected:
                </p>
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
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
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