import { useState, useEffect } from "react";
import { Search, Plus, Users, Eye, Edit2, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AddEditFamilyModal } from "@/components/AddEditFamilyModal";

const FamiliesPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [editingFamily, setEditingFamily] = useState<any>(null);

  const [families, setFamilies] = useState([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(true);
  const [familiesError, setFamiliesError] = useState(null);
  const [isLoadingFamilyDetails, setIsLoadingFamilyDetails] = useState(false);

  const fetchFamilies = async () => {
    setIsLoadingFamilies(true);
    setFamiliesError(null);
    try {
      const response = await api.families.getAll();
      console.log('=== FAMILIES API RESPONSE ===');
      console.log('Full response:', response);
      
      // Unwrap the response if it's wrapped in { success, data }
      const familiesData = response?.data || response;
      console.log('Families data:', familiesData);
      
      // Log member counts for debugging
      if (Array.isArray(familiesData) && familiesData.length > 0) {
        console.log('Sample family:', familiesData[0]);
        console.log('Member counts:', familiesData.map(f => ({
          name: f.familyName,
          count: f.memberCount
        })));
      }
      
      setFamilies(Array.isArray(familiesData) ? familiesData : []);
    } catch (error) {
      console.error('Error fetching families:', error);
      setFamiliesError(error.message || 'Failed to load families');
      toast({
        title: "Error",
        description: "Failed to load families",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFamilies(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
    
    // Auto-refresh every 60 seconds to get new data from Google Sheets
    const interval = setInterval(() => {
      fetchFamilies();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredFamilies = families.filter(family =>
    family && family.familyName && family.familyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFamily = async (familyData: any) => {
    try {
      console.log('=== CREATING FAMILY ===');
      console.log('Family data:', familyData);
      
      const response = await api.families.create(familyData);
      console.log('Create response:', response);
      
      // Unwrap response if needed
      const newFamily = response?.data || response;
      console.log('New family created:', newFamily);
      
      toast({
        title: "Success",
        description: "Family added successfully",
      });
      
      // Refresh the families list
      fetchFamilies();
      
      // Return the created family so modal can use the familyID
      return newFamily;
    } catch (error) {
      console.error('Error adding family:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add family",
        variant: "destructive",
      });
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleEditFamily = async (familyData: any) => {
    try {
      console.log('=== UPDATING FAMILY ===');
      console.log('Family ID:', familyData.familyID);
      console.log('Family data:', familyData);
      
      const response = await api.families.update(familyData.familyID, familyData);
      console.log('Update response:', response);
      
      // Unwrap response if needed
      const updatedFamily = response?.data || response;
      
      toast({
        title: "Success",
        description: "Family updated successfully",
      });
      
      // Refresh the families list
      fetchFamilies();
      
      // Return the updated family data
      return updatedFamily || familyData;
    } catch (error) {
      console.error('Error updating family:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update family",
        variant: "destructive",
      });
      throw error; // Re-throw so modal can handle it
    }
  };

  const openEditModal = (family: any) => {
    setEditingFamily(family);
    setIsEditModalOpen(true);
  };

  const handleViewFamily = async (family: any) => {
    setIsLoadingFamilyDetails(true);
    try {
      const response = await api.families.getById(family.familyID);
      console.log('=== FAMILY DETAILS RESPONSE ===');
      console.log('Full response:', response);
      
      // Unwrap the response if it's wrapped in { success, data }
      const familyDetails = response?.data || response;
      console.log('Family details:', familyDetails);
      
      setSelectedFamily(familyDetails);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching family details:', error);
      toast({
        title: "Error",
        description: "Failed to load family details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFamilyDetails(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Families</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage family units and relationships</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)} disabled={isLoadingFamilies}>
            <Plus className="h-4 w-4" />
            Add New Family
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Families</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFamilies ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{families.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFamilies ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {families.reduce((sum, family) => sum + (family?.memberCount || 0), 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Family Size</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFamilies ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {families.length > 0 ?
                    Math.round(families.reduce((sum, family) => sum + (family?.memberCount || 0), 0) / families.length * 10) / 10
                    : 0
                  }
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Year</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFamilies ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {families.filter(family => {
                    if (!family?.createdDate) return false;
                    const createdYear = new Date(family.createdDate).getFullYear();
                    const currentYear = new Date().getFullYear();
                    return createdYear === currentYear;
                  }).length}
                </div>
              )}
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
                  placeholder="Search families..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isLoadingFamilies}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Families Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingFamilies ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : familiesError ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Families Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between">
                            <span>{familiesError}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchFamilies}
                              disabled={isLoadingFamilies}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredFamilies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No families found matching your search.' : 'No families found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFamilies.map((family) => (
                      <TableRow key={family.familyID} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{family.familyName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {family?.memberCount || 0} member{(family?.memberCount || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>{family?.createdDate || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFamily(family)}
                              disabled={isLoadingFamilyDetails}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Family Modal */}
      <AddEditFamilyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddFamily}
        mode="add"
      />

      {/* Edit Family Modal */}
      <AddEditFamilyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFamily(null);
        }}
        onSave={handleEditFamily}
        family={editingFamily}
        mode="edit"
      />

      {/* View Family Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isLoadingFamilyDetails ? 'Loading...' : selectedFamily?.familyName}
            </DialogTitle>
            <DialogDescription>
              Family details and member information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {isLoadingFamilyDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Family Name</Label>
                    <p className="font-medium">{selectedFamily?.familyName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Family ID</Label>
                    <p className="font-medium text-sm">{selectedFamily?.familyID || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created Date</Label>
                    <p className="font-medium">{selectedFamily?.createdDate || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Members</Label>
                    <p className="font-medium">{selectedFamily?.memberCount || 0}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">
                    Family Members ({selectedFamily?.members?.length || 0})
                  </Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedFamily?.members?.length > 0 ? (
                      selectedFamily.members.map((member: any, index: number) => (
                        <div key={member.memberID || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium">
                              {member?.firstName || ''} {member?.lastName || ''}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {member?.memberType || member?.status || 'Member'}
                              </Badge>
                              {member?.gender && (
                                <Badge variant="secondary" className="text-xs">
                                  {member.gender}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {member?.email && (
                              <p className="text-muted-foreground">{member.email}</p>
                            )}
                            {member?.phoneNumber && (
                              <p className="text-muted-foreground">{member.phoneNumber}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No members assigned to this family yet.</p>
                        <p className="text-sm mt-1">Add members to this family from the Members page.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)} disabled={isLoadingFamilyDetails}>
              Close
            </Button>
            <Button
              onClick={() => {
                openEditModal(selectedFamily);
                setIsViewModalOpen(false);
              }}
              disabled={isLoadingFamilyDetails}
            >
              Edit Family
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FamiliesPage;