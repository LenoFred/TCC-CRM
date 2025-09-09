import { useState } from "react";
import { Search, Plus, MapPin, Users, Activity, Eye, Edit2, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const [branches, setBranches] = useState<Branch[]>([
    {
      id: 1,
      name: "TCC - Main Campus",
      location: "Downtown",
      address: "123 Main Street, City Center",
      pastor: "Pastor John Smith",
      memberCount: 450,
      status: "Active",
      establishedDate: "1985-01-15",
      phone: "+1 234-567-8900",
      email: "main@tccchurch.com"
    },
    {
      id: 2,
      name: "TCC - North Branch",
      location: "North District",
      address: "456 North Avenue, North City",
      pastor: "Pastor Sarah Johnson",
      memberCount: 280,
      status: "Active",
      establishedDate: "2010-06-20",
      phone: "+1 234-567-8901",
      email: "north@tccchurch.com"
    },
    {
      id: 3,
      name: "TCC - South Branch",
      location: "South District",
      address: "789 South Road, South City",
      pastor: "Pastor Michael Brown",
      memberCount: 320,
      status: "Active",
      establishedDate: "2008-03-10",
      phone: "+1 234-567-8902",
      email: "south@tccchurch.com"
    },
    {
      id: 4,
      name: "TCC - East Campus",
      location: "East District",
      address: "321 East Street, East City",
      pastor: "Pastor Lisa Davis",
      memberCount: 180,
      status: "Developing",
      establishedDate: "2020-01-01",
      phone: "+1 234-567-8903",
      email: "east@unitychurch.com"
    }
  ]);

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

  const handleAddBranch = () => {
    if (!newBranchData.name || !newBranchData.location || !newBranchData.pastor) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newBranch: Branch = {
      id: Date.now(),
      ...newBranchData,
      memberCount: 0,
      status: "Developing",
      establishedDate: new Date().toISOString().split('T')[0],
    };

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
  };

  const handleViewBranch = (branch: Branch) => {
    setSelectedBranchData(branch);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Branches</h1>
            <p className="text-muted-foreground">Manage church branches and switch dashboard contexts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewAllBranches}>
              <Activity className="h-4 w-4 mr-2" />
              View All Branches
            </Button>
            <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add New Branch
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
              <div className="text-2xl font-bold text-foreground">{branches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeBranches}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average per Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {branches.length > 0 ? Math.round(totalMembers / branches.length) : 0}
              </div>
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
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Branches Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Pastor</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Established</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {branch.location}
                        </div>
                      </TableCell>
                      <TableCell>{branch.pastor}</TableCell>
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
                      <TableCell>{branch.establishedDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewBranch(branch)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSwitchToBranch(branch.id)}
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <Button onClick={handleAddBranch}>
              Add Branch
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