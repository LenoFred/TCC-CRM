import { useState } from "react";
import { Search, Plus, Users, Eye, Edit2 } from "lucide-react";
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

  const [families, setFamilies] = useState([
    {
      id: 1,
      familyName: "Smith Family",
      memberCount: 4,
      members: [
        { name: "John Smith", role: "Head of Family", email: "john.smith@email.com" },
        { name: "Jane Smith", role: "Spouse", email: "jane.smith@email.com" },
        { name: "Tommy Smith", role: "Child", email: "" },
        { name: "Sarah Smith", role: "Child", email: "" }
      ],
      createdDate: "2022-01-15"
    },
    {
      id: 2,
      familyName: "Johnson Family",
      memberCount: 3,
      members: [
        { name: "Mary Johnson", role: "Head of Family", email: "mary.j@email.com" },
        { name: "Robert Johnson", role: "Spouse", email: "robert.j@email.com" },
        { name: "Emily Johnson", role: "Child", email: "" }
      ],
      createdDate: "2021-03-22"
    },
    {
      id: 3,
      familyName: "Wilson Family",
      memberCount: 2,
      members: [
        { name: "David Wilson", role: "Head of Family", email: "d.wilson@email.com" },
        { name: "Sarah Wilson", role: "Spouse", email: "s.wilson@email.com" }
      ],
      createdDate: "2020-07-10"
    }
  ]);

  const filteredFamilies = families.filter(family =>
    family.familyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFamily = (familyData: any) => {
    setFamilies([...families, familyData]);
  };

  const handleEditFamily = (familyData: any) => {
    setFamilies(families.map(family => 
      family.id === familyData.id ? familyData : family
    ));
  };

  const openEditModal = (family: any) => {
    setEditingFamily(family);
    setIsEditModalOpen(true);
  };

  const handleViewFamily = (family: any) => {
    setSelectedFamily(family);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Families</h1>
            <p className="text-muted-foreground">Manage family units and relationships</p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
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
              <div className="text-2xl font-bold text-foreground">{families.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {families.reduce((sum, family) => sum + family.memberCount, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Family Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {families.length > 0 ? 
                  Math.round(families.reduce((sum, family) => sum + family.memberCount, 0) / families.length * 10) / 10 
                  : 0
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2</div>
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
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Families Table */}
            <div className="rounded-md border">
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
                  {filteredFamilies.map((family) => (
                    <TableRow key={family.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{family.familyName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {family.memberCount} member{family.memberCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>{family.createdDate}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewFamily(family)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <DialogTitle>{selectedFamily?.familyName}</DialogTitle>
            <DialogDescription>
              Family details and member information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Family Name</Label>
                <p className="font-medium">{selectedFamily?.familyName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Created Date</Label>
                <p className="font-medium">{selectedFamily?.createdDate}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">Family Members</Label>
              <div className="space-y-2">
                {selectedFamily?.members?.length > 0 ? (
                  selectedFamily.members.map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="text-right">
                        {member.email && (
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No members assigned to this family yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              openEditModal(selectedFamily);
              setIsViewModalOpen(false);
            }}>
              Edit Family
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FamiliesPage;