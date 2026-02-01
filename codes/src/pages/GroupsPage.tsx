import { useState, useEffect } from "react";
import { Plus, Search, Users, MoreHorizontal, Eye, Edit2, Trash2, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddEditGroupModal } from "@/components/AddEditGroupModal";
import { GroupProfileModal } from "@/components/GroupProfileModal";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { api } from "@/config/api";

// Group interface - id must be string for API compatibility
interface Group {
  id: string;  // Must be string - matches backend GroupID
  name: string;
  type: 'Department' | 'Ministry' | 'Committee' | 'Small Group' | 'General';
  description?: string;
  leader?: string;
  leaderContact?: string;
  members: string[];
  location?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  assistantLeader?: string;
  pastor?: string;
  classType?: string;
  sessionNumber?: string | number;
}

const GroupsPage = () => {
  const { toast } = useToast();
  const { canEdit, canDelete } = usePermission();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch groups from backend
  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    setGroupsError(null);
    try {
      const response = await api.groups.getAll();
      console.log('Groups data received:', response);
      
      const groupsData = response.data || [];
      console.log('Groups array:', groupsData);
      console.log('Total groups:', groupsData.length);
      
      // Transform data to match UI expectations
      const transformedGroups: Group[] = groupsData.map((group: any) => ({
        id: String(group.groupID || group.id), // Ensure id is always a string
        name: group.groupName || group.name,
        type: group.groupType || group.type || 'General',
        description: group.description || '',
        leader: group.leaderMemberID || '',
        leaderContact: '',
        members: Array(group.memberCount || 0).fill(''), // Create array with correct length based on memberCount
        location: group.meetingLocation || '',
        status: group.status || 'Active',
        assistantLeader: group.AsstLeaderID || group.assistantLeader || '',
        pastor: group.PastorID || group.pastor || '',
        classType: group.classType || group.ClassType || '',
        sessionNumber: group.sessionNumber || group.SessionNumber || '',
        createdDate: new Date().toLocaleDateString(),
      }));
      
      console.log('Transformed groups sample:', transformedGroups[0]);
      
      setGroups(transformedGroups);
      return transformedGroups;
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      setGroupsError(error.message || 'Failed to load groups');
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGroups();
  }, []);

  // Filter groups based on search term
  useEffect(() => {
    const filtered = groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.leader && group.leader.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredGroups(filtered);
  }, [searchTerm, groups]);

  const handleSaveGroup = async (groupData: any) => {
    try {
      let savedGroupID: string;
      const normalizedClassType = groupData.classType === 'none' ? '' : (groupData.classType || '');
      
      if (selectedGroup) {
        // Update existing group
        const updateData = {
          groupName: groupData.name,
          groupType: groupData.type,
          leaderMemberID: groupData.leader || '',
          AsstLeaderID: groupData.assistantLeader || '',
          PastorID: groupData.pastor || '',
          classType: normalizedClassType,
          ClassType: normalizedClassType,
          status: groupData.status || 'Active',
          meetingLocation: groupData.location || '',
          description: groupData.description || '',
        };
        
        // TypeScript workaround: explicitly cast to string
        await api.groups.update(selectedGroup.id as any as string, updateData);
        savedGroupID = selectedGroup.id as any as string;
        
        // Handle group members update - add new members and remove deleted members
        // Add new members
        if (groupData.members && groupData.members.length > 0) {
          try {
            console.log('=== ADDING NEW MEMBERS (from edit form) ===');
            console.log('Members to add:', groupData.members.map((m: any) => m.memberID));
            
            // Prepare members data for batch create
            const membersToCreate = groupData.members.map((member: any) => ({
              memberID: member.memberID,
              groupID: savedGroupID,
            }));
            
            // Use batch create API - single operation for all additions
            await api.groupMembers.batchCreate(membersToCreate);
            
            console.log(`=== ADDED ${groupData.members.length} NEW MEMBERS (batch) ===`);
          } catch (memberError) {
            console.error('Error adding group members:', memberError);
            toast({
              title: "Warning",
              description: "Group updated but some members could not be added.",
              variant: "destructive",
            });
          }
        }
        
        // Remove deleted members
        if (groupData.removedMembers && groupData.removedMembers.length > 0) {
          try {
            console.log('=== REMOVING MEMBERS (from edit form) ===');
            console.log('Members to remove:', groupData.removedMembers.map((m: any) => `${m.memberID} (${m.groupMemberID})`));
            
            // Extract GroupMemberIDs for batch deletion
            const groupMemberIDsToDelete = groupData.removedMembers.map((m: any) => m.groupMemberID);
            
            // Use batch delete API - single operation for all deletions
            await api.groupMembers.batchDelete(groupMemberIDsToDelete);
            
            console.log(`=== REMOVED ${groupData.removedMembers.length} MEMBERS (batch) ===`);
          } catch (memberError) {
            console.error('Error removing group members:', memberError);
            toast({
              title: "Warning",
              description: "Group updated but some members could not be removed.",
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "Group updated successfully",
          description: `${groupData.name} has been updated.`,
        });
      } else {
        // Add new group
        const createData = {
          groupName: groupData.name,
          groupType: groupData.type,
          leaderMemberID: groupData.leader || '',
          asstLeaderID: groupData.assistantLeader || '',
          pastorID: groupData.pastor || '',
          AsstLeaderID: groupData.assistantLeader || '',
          PastorID: groupData.pastor || '',
          classType: normalizedClassType,
          ClassType: normalizedClassType,
          status: groupData.status || 'Active',
          meetingLocation: groupData.location || '',
          description: groupData.description || '',
        };
        
        const response = await api.groups.create(createData);
        savedGroupID = response.data?.groupID;
        
        console.log('=== GROUP CREATED ===');
        console.log('Group ID:', savedGroupID);
        console.log('Members to add:', groupData.members);
        
        // Add group members to GroupMembers sheet
        if (savedGroupID && groupData.members && groupData.members.length > 0) {
          try {
            console.log('=== ADDING MEMBERS TO NEW GROUP ===');
            
            // Prepare members data for batch create
            const membersToCreate = groupData.members.map((member: any) => ({
              memberID: member.memberID,
              groupID: savedGroupID,
            }));
            
            // Use batch create API - single operation for all additions
            await api.groupMembers.batchCreate(membersToCreate);
            
            console.log(`=== ADDED ${groupData.members.length} MEMBERS (batch) ===`);
          } catch (memberError) {
            console.error('Error adding group members:', memberError);
            toast({
              title: "Warning",
              description: "Group created but some members could not be added. Please add them manually.",
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "Group added successfully",
          description: `${groupData.name} has been added with ${groupData.members?.length || 0} members.`,
        });
      }
      
      // Refresh groups list
      await fetchGroups();
      
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedGroup(null);
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save group",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"?\n\nThis action cannot be undone and will remove the group and all its members.`
    );

    if (!confirmed) {
      return; // User cancelled
    }

    try {
      // TypeScript workaround: explicitly cast to string
      await api.groups.delete(group.id as any as string);
      
      toast({
        title: "Group deleted",
        description: `${group.name} has been removed from the system.`,
      });
      
      // Refresh groups list
      await fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (group: Group) => {
    setSelectedGroup(group);
    setIsProfileModalOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Department': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Ministry': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Committee': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Small Group': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Groups & Departments</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage church groups, ministries, and departments</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchGroups}
              variant="outline"
              size="icon"
              disabled={isLoadingGroups}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingGroups ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
              disabled={!canEdit('groups')}
            >
              <Plus className="w-4 h-4" />
              Add New Group
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {groupsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{groupsError}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{groups.length}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{groups.filter(g => g.type === 'Department').length}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ministries</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{groups.filter(g => g.type === 'Ministry').length}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{groups.reduce((acc, g) => acc + g.members.length, 0)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Groups Directory</CardTitle>
              <div className="relative flex-1 max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search groups by name, type, or leader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden xl:table-cell">Leader</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="hidden lg:table-cell">Meeting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="w-12 h-12 opacity-20" />
                          <p className="text-sm">No groups found</p>
                          {searchTerm && (
                            <p className="text-xs">Try adjusting your search</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups.map((group) => (
                      <TableRow 
                        key={group.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewProfile(group)}
                      >
                        <TableCell className="font-medium">
                          <div className="font-semibold">{group.name}</div>
                          {group.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {group.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge className={getTypeColor(group.type)}>
                            {group.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {group.leader || 'No Leader'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {group.members.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {group.location || 'Not set'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(group.status)}>
                            {group.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border border-border">
                              <DropdownMenuItem onClick={() => handleViewProfile(group)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              {canEdit('groups') && (
                                <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit Group
                                </DropdownMenuItem>
                              )}
                              {canDelete('groups') && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteGroup(group)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Group
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <AddEditGroupModal
          key="add-group-modal"
          group={null}
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedGroup(null);
          }}
          onSave={handleSaveGroup}
        />

        <AddEditGroupModal
          key={`edit-group-${selectedGroup?.id || 'none'}`}
          group={selectedGroup}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGroup(null);
          }}
          onSave={handleSaveGroup}
          isEdit
        />

        <GroupProfileModal
          group={selectedGroup}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedGroup(null);
          }}
          onEdit={(group) => {
            setIsProfileModalOpen(false);
            handleEditGroup(group);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default GroupsPage;