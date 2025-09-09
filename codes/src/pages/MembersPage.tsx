import { useState } from "react";
import { Search, Plus, Filter, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import { AddEditMemberModal } from "@/components/AddEditMemberModal";
import { useToast } from "@/hooks/use-toast";

const MembersPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1 234-567-8901",
      status: "Active",
      joinDate: "2022-01-15",
      family: "Smith Family",
      address: "123 Main St, City, State 12345",
      emergencyContact: "Jane Smith - +1 234-567-8902",
      dateOfBirth: "1985-03-20",
      membershipType: "Regular Member"
    },
    {
      id: 2,
      name: "Mary Johnson",
      email: "mary.j@email.com",
      phone: "+1 234-567-8902",
      status: "Active",
      joinDate: "2021-03-22",
      family: "Johnson Family",
      address: "456 Oak Ave, City, State 12345",
      emergencyContact: "Robert Johnson - +1 234-567-8903",
      dateOfBirth: "1990-07-15",
      membershipType: "Regular Member"
    },
    {
      id: 3,
      name: "David Wilson",
      email: "d.wilson@email.com",
      phone: "+1 234-567-8903",
      status: "Inactive",
      joinDate: "2020-07-10",
      family: "Wilson Family",
      address: "789 Pine St, City, State 12345",
      emergencyContact: "Sarah Wilson - +1 234-567-8904",
      dateOfBirth: "1978-11-03",
      membershipType: "Associate Member"
    }
  ]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (member) => {
    setSelectedMember(member);
    setIsProfileModalOpen(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsAddEditModalOpen(true);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveMember = (memberData) => {
    if (editingMember) {
      // Update existing member
      setMembers(prev => prev.map(m => 
        m.id === editingMember.id ? { ...memberData, id: editingMember.id } : m
      ));
    } else {
      // Add new member
      setMembers(prev => [...prev, { ...memberData, id: Date.now() }]);
    }
    setIsAddEditModalOpen(false);
    setEditingMember(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Members</h1>
            <p className="text-muted-foreground">Manage church membership records</p>
          </div>
          <Button className="gap-2" onClick={handleAddMember}>
            <UserPlus className="h-4 w-4" />
            Add New Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">348</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">312</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Families</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">156</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Members Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.status === 'Active' ? 'default' : 'secondary'}
                          className={member.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.joinDate}</TableCell>
                      <TableCell>{member.family}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewProfile(member)}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredMembers.length} of {members.length} members
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <MemberProfileModal
        member={selectedMember}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={handleEditMember}
      />

      <AddEditMemberModal
        member={editingMember}
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveMember}
        isEdit={!!editingMember}
      />
    </DashboardLayout>
  );
};

export default MembersPage;