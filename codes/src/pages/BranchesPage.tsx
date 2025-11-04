import { useState, useEffect } from "react";
import { Search, Plus, MapPin, Users, Activity, Eye, Edit2, Building2, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: number;
  name: string;
  location: string;
  address: string;
  pastor: string;
  memberCount: number;
  status: string;
  establishedDate: string;
  phone?: string;
  email?: string;
}

const BranchesPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBranchData, setSelectedBranchData] = useState<Branch | null>(null);
  const [newBranchData, setNewBranchData] = useState({
    name: "",
    location: "",
    address: "",
    pastor: "",
    phone: "",
    email: "",
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchesError, setBranchesError] = useState(null);

  const fetchBranches = async () => {
    setIsLoadingBranches(true);
    setBranchesError(null);
    try {
      const data = await api.branches.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranchesError(error.message || 'Failed to load branches');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.pastor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = branches.reduce((sum, branch) => sum + branch.memberCount, 0);
  const activeBranches = branches.filter(b => b.status === 'Active').length;

  const handleSwitchToBranch = (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      toast({
        title: "Branch Switched",
        description: `Dashboard switched to ${branch.name}`,
      });
      // In a real app, this would switch the dashboard context
    }
  };

  const handleViewAllBranches = () => {
    setSelectedBranch("all");
    toast({
      title: "View Mode Changed",
      description: "Showing data from all branches",
    });
  };

  const handleAddBranch = async () => {
    if (!newBranchData.name || !newBranchData.location || !newBranchData.pastor) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingBranch(true);
    try {
      const newBranch = await api.branches.create({
        ...newBranchData,
        memberCount: 0,
        status: "Developing",
        establishedDate: new Date().toISOString().split('T')[0],
      });

      setBranches([...branches, newBranch]);

      toast({
        title: "Branch Added",
        description: `${newBranchData.name} has been added successfully.`,
      });

      setNewBranchData({
        name: "",
        location: "",
        address: "",
        pastor: "",
        phone: "",
        email: "",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding branch:', error);
      toast({
        title: "Error",
        description: "Failed to add branch",
        variant: "destructive",
      });
    } finally {
      setIsAddingBranch(false);
    }
  };

  const handleViewBranch = (branch: Branch) => {
    setSelectedBranchData(branch);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Branches</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage church branches and switch dashboard contexts</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleViewAllBranches} className="flex-1 sm:flex-none">
              <Activity className="h-4 w-4 mr-2" />
              View All
            </Button>
            <Button className="gap-2 flex-1 sm:flex-none" onClick={() => setIsAddModalOpen(true)} disabled={isLoadingBranches}>
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Branches</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBranches ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{branches.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Branches</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBranches ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{activeBranches}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBranches ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average per Branch</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBranches ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {branches.length > 0 ? Math.round(totalMembers / branches.length) : 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Branch Context Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dashboard Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="branch-select">Current Dashboard View</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isLoadingBranches}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch to view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches (Combined View)</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Current Context</Label>
                <div className="mt-1">
                  <Badge variant={selectedBranch === "all" ? "default" : "secondary"}>
                    {selectedBranch === "all" ? "All Branches" : 
                     branches.find(b => b.id.toString() === selectedBranch)?.name || "Select Branch"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isLoadingBranches}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Branches Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Pastor</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Established</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBranches ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : branchesError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Branches Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between">
                            <span>{branchesError}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchBranches}
                              disabled={isLoadingBranches}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredBranches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No branches found matching your search.' : 'No branches found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBranches.map((branch) => (
                      <TableRow key={branch.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{branch.location}</TableCell>
                        <TableCell className="hidden lg:table-cell">{branch.pastor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {branch.memberCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={branch.status === 'Active' ? 'default' : 'secondary'}>
                            {branch.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">{branch.establishedDate}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBranch(branch)}
                            disabled={isAddingBranch}
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
          </CardContent>
        </Card>
      </div>

      {/* Add Branch Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new church branch location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="branchName">Branch Name *</Label>
              <Input
                id="branchName"
                value={newBranchData.name}
                onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                placeholder="e.g., TCC - West Campus"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newBranchData.location}
                  onChange={(e) => setNewBranchData({ ...newBranchData, location: e.target.value })}
                  placeholder="e.g., West District"
                />
              </div>
              <div>
                <Label htmlFor="pastor">Pastor *</Label>
                <Input
                  id="pastor"
                  value={newBranchData.pastor}
                  onChange={(e) => setNewBranchData({ ...newBranchData, pastor: e.target.value })}
                  placeholder="e.g., Pastor John Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={newBranchData.address}
                onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
                placeholder="Street address, city, state"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newBranchData.phone}
                  onChange={(e) => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                  placeholder="+1 234-567-8900"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newBranchData.email}
                  onChange={(e) => setNewBranchData({ ...newBranchData, email: e.target.value })}
                  placeholder="branch@unitychurch.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBranch} disabled={isAddingBranch}>
              {isAddingBranch ? "Adding..." : "Add Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Branch Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedBranchData?.name}</DialogTitle>
            <DialogDescription>
              Branch details and information
            </DialogDescription>
          </DialogHeader>
          {selectedBranchData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Branch Name</Label>
                  <p className="font-medium">{selectedBranchData.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge variant={selectedBranchData.status === 'Active' ? 'default' : 'secondary'}>
                    {selectedBranchData.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedBranchData.location}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Pastor</Label>
                  <p className="font-medium">{selectedBranchData.pastor}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Full Address</Label>
                <p className="font-medium">{selectedBranchData.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedBranchData.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedBranchData.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Member Count</Label>
                  <p className="font-medium">{selectedBranchData.memberCount}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Established Date</Label>
                  <p className="font-medium">{selectedBranchData.establishedDate}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => handleSwitchToBranch(selectedBranchData?.id || 0)}>
              Switch to This Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BranchesPage;