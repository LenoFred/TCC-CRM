import { useState, useEffect } from "react";
import { Plus, Search, Users, MoreHorizontal, Eye, Edit2, Trash2, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Group {
  id: number;
  name: string;
  type: 'Department' | 'Ministry' | 'Committee' | 'Small Group';
  description?: string;
  leader?: string;
  leaderContact?: string;
  members: string[];
  location?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

const GroupsPage = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 1,
      name: "Youth Ministry",
      type: "Ministry",
      description: "Ministry for young people aged 12-25",
      leader: "John Smith",
      leaderContact: "+234 803 123 4567",
      members: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"],
      location: "Youth Hall",
      status: "Active",
      createdDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Choir Department",
      type: "Department",
      description: "Church choir and music ministry",
      leader: "Mary Johnson",
      leaderContact: "+234 805 987 6543",
      members: ["Alice Brown", "Bob Davis", "Carol White", "David Lee"],
      location: "Main Sanctuary",
      status: "Active",
      createdDate: "2024-01-10"
    },
    {
      id: 3,
      name: "Finance Committee",
      type: "Committee",
      description: "Oversees church financial matters",
      leader: "Robert Wilson",
      leaderContact: "+234 807 456 1234",
      members: ["Emma Davis", "Frank Miller"],
      location: "Conference Room",
      status: "Active",
      createdDate: "2024-01-05"
    }
  ]);

  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const filtered = groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.leader && group.leader.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredGroups(filtered);
  }, [searchTerm, groups]);

  const handleSaveGroup = (groupData: Omit<Group, 'id'>) => {
    if (selectedGroup) {
      // Update existing group
      setGroups(prev => prev.map(group => 
        group.id === selectedGroup.id ? { ...groupData, id: selectedGroup.id } : group
      ));
      toast({
        title: "Group updated successfully",
        description: `${groupData.name} has been updated.`,
      });
    } else {
      // Add new group
      const newGroup = { ...groupData, id: Date.now() };
      setGroups(prev => [...prev, newGroup]);
      toast({
        title: "Group added successfully",
        description: `${groupData.name} has been added to the system.`,
      });
    }
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedGroup(null);
  };

  const handleDeleteGroup = (group: Group) => {
    setGroups(prev => prev.filter(g => g.id !== group.id));
    toast({
      title: "Group deleted",
      description: `${group.name} has been removed from the system.`,
    });
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
            <h1 className="text-2xl font-bold text-foreground">Groups & Departments</h1>
            <p className="text-muted-foreground">Manage church groups, ministries, and departments</p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Group
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.length}</div>
              <p className="text-xs text-muted-foreground">
                Active groups and departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.filter(g => g.type === 'Department').length}</div>
              <p className="text-xs text-muted-foreground">
                Church departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ministries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.filter(g => g.type === 'Ministry').length}</div>
              <p className="text-xs text-muted-foreground">
                Active ministries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.reduce((acc, g) => acc + g.members.length, 0)}</div>
              <p className="text-xs text-muted-foreground">
                Across all groups
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search groups by name, type, or leader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Groups Table */}
        <Card>
          <CardHeader>
            <CardTitle>Groups Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Members</TableHead>
                      <TableHead>Meeting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {group.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(group.type)}>
                          {group.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{group.leader || 'No Leader'}</div>
                          {group.leaderContact && (
                            <div className="text-sm text-muted-foreground">{group.leaderContact}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{group.members.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{group.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(group.status)}>
                          {group.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Group
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGroup(group)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <AddEditGroupModal
          group={null}
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedGroup(null);
          }}
          onSave={handleSaveGroup}
        />

        <AddEditGroupModal
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
        />
      </div>
    </DashboardLayout>
  );
};

export default GroupsPage;