import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Download, UserPlus, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import { AddEditMemberModal } from "@/components/AddEditMemberModal";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

const MembersPage = () => {
  const { toast } = useToast();  const { canEdit } = usePermission();  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Handle URL parameter for opening add member modal
  useEffect(() => {
    const addParam = searchParams.get('add');
    if (addParam === 'true') {
      handleAddMember();
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [searchParams]);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState(null);

  const handleExportMembers = () => {
    try {
      // Prepare CSV headers
      const headers = ['Member ID', 'Name', 'Email', 'Phone', 'Status', 'Join Date', 'Family ID', 'Date of Birth', 'Gender', 'Membership Type', 'Address'];
      
      // Prepare CSV rows
      const rows = filteredMembers.map((member: any) => [
        member.id || '',
        member.name || '',
        member.email || '',
        member.phone || '',
        member.status || '',
        member.joinDate || '',
        member.family || '',
        member.dateOfBirth || '',
        member.gender || '',
        member.membershipType || '',
        member.address || ''
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredMembers.length} members to CSV file`,
      });
    } catch (error) {
      console.error('Error exporting members:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export members data",
        variant: "destructive",
      });
    }
  };

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const response = await api.members.getAll();
      console.log('Members data received:', response);
      
      // Extract data from response object
      const membersData = response.data || [];
      console.log('Members array:', membersData);
      console.log('Total members:', membersData.length);
      console.log('First member RAW from API:', JSON.stringify(membersData[0], null, 2));
      
      // Transform data to match UI expectations
      const transformedMembers = membersData.map((member: any) => ({
        ...member, // Keep ALL original backend data first
        id: member.memberID || member.id, // Frontend ID
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
        email: member.email,
        phone: member.phoneNumber || member.phone,
        // Status is already in the correct field from backend
        status: member.status || 'Active', 
        joinDate: member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '',
        family: member.familyID || '',
      }));
      
      console.log('Transformed members sample:', transformedMembers[0]);
      
      setMembers(transformedMembers);
      return transformedMembers; // Return the data so it can be used immediately
    } catch (error: any) {
      console.error('Error fetching members:', error);
      setMembersError(error.message || 'Failed to load members');
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
      return []; // Return empty array on error
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    
    // Auto-refresh every 60 seconds to get new data from Google Sheets
    const interval = setInterval(() => {
      fetchMembers();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredMembers = members.filter(member =>
    member && (
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
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

  const handleSaveMember = async (memberData: any) => {
    try {
      console.log('Saving member with data:', memberData);
      
      // Transform data to match backend schema
      const backendData = {
        firstName: memberData.firstName,
        lastName: memberData.surname || memberData.lastName,
        email: memberData.email,
        phone: memberData.phone || memberData.phoneNumber,
        phoneNumber: memberData.phone || memberData.phoneNumber,
        dateOfBirth: memberData.dateOfBirth || memberData.dOB,
        gender: memberData.gender,
        address: memberData.address,
        familyId: memberData.familyId || memberData.familyID,
        status: memberData.status || memberData.memberStatus, // Send as 'status' for backend
        memberStatus: memberData.status || memberData.memberStatus,
        state: memberData.state,
        lga: memberData.lga,
        membershipType: memberData.membershipType,
        emergencyContact: memberData.emergencyContact,
        joinDate: memberData.joinDate || new Date().toISOString().split('T')[0],
      };

      console.log('Backend data to send:', backendData);
      console.log('Status field specifically:', { status: backendData.status, memberStatus: backendData.memberStatus });

      if (editingMember) {
        // Update existing member - use memberID from the backend
        const memberId = editingMember.memberID || editingMember.id;
        const response: any = await api.members.update(String(memberId), backendData);
        console.log('Update response:', response);
        
        // Refresh the members list and get the updated data
        const updatedMembers = await fetchMembers();
        
        // If editing from profile modal, find and set the updated member
        if (selectedMember) {
          const currentMemberId = selectedMember.memberID || selectedMember.id;
          console.log('Looking for updated member. Current ID:', currentMemberId, 'Target ID:', memberId);
          if (currentMemberId === memberId) {
            // Find the updated member in the refreshed list
            const updatedMemberFromList = updatedMembers.find((m: any) => 
              (m.memberID || m.id) === memberId
            );
            if (updatedMemberFromList) {
              console.log('Found updated member in list:', updatedMemberFromList);
              console.log('Updated member status:', updatedMemberFromList.status);
              console.log('Updated member memberStatus:', updatedMemberFromList.memberStatus);
              console.log('Updated member lGA:', updatedMemberFromList.lGA);
              console.log('Updated member lga:', updatedMemberFromList.lga);
              setSelectedMember(updatedMemberFromList);
            } else {
              console.error('Could not find updated member in list. Members:', updatedMembers);
            }
          }
        }
        
        toast({
          title: "Success",
          description: "Member updated successfully",
        });
      } else {
        // Add new member
        const response: any = await api.members.create(backendData);
        console.log('Create response:', response);
        
        // Refresh the members list
        await fetchMembers();
        
        toast({
          title: "Success",
          description: "Member added successfully",
        });
      }
      setIsAddEditModalOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      console.error('Error saving member:', error);
      
      // Extract semantic validation errors from backend
      let errorMessage = "Failed to save member";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Members</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage church membership records</p>
          </div>
          {canEdit('members') && (
            <Button className="gap-2 w-full sm:w-auto" onClick={handleAddMember} disabled={isLoadingMembers}>
              <UserPlus className="h-4 w-4" />
              Add New Member
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{members.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{members.filter(m => m && m.status === 'Active').length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {members.filter(m => {
                    if (!m || !m.joinDate) return false;
                    const joinDate = new Date(m.joinDate);
                    if (isNaN(joinDate.getTime())) return false;
                    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    return joinDate > thisMonthStart;
                  }).length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Families</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{new Set(members.map(m => m?.family).filter(f => f)).size}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isLoadingMembers}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportMembers}
                  disabled={isLoadingMembers || filteredMembers.length === 0}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Members Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Join Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Family</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingMembers ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : membersError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Members Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between">
                            <span>{membersError}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchMembers}
                              disabled={isLoadingMembers}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No members found matching your search.' : 'No members found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow 
                        key={member.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewProfile(member)}
                      >
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">{member.phone}</TableCell>
                        <TableCell>
                          <Badge
                            variant={member.status === 'Active' ? 'default' : 'secondary'}
                            className={member.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">{member.joinDate}</TableCell>
                        <TableCell className="hidden lg:table-cell">{member.family}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(member);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
              {isLoadingMembers ? (
                <>
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredMembers.length} of {members.length} members
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <MemberProfileModal
        member={selectedMember}
        isOpen={isProfileModalOpen}
        onClose={() => {
          console.log('Closing MemberProfileModal');
          setIsProfileModalOpen(false);
        }}
        onEdit={handleEditMember}
      />

      <AddEditMemberModal
        member={editingMember}
        isOpen={isAddEditModalOpen}
        onClose={() => {
          console.log('Closing AddEditMemberModal');
          setIsAddEditModalOpen(false);
        }}
        onSave={handleSaveMember}
        isEdit={!!editingMember}
      />
    </DashboardLayout>
  );
};

export default MembersPage;