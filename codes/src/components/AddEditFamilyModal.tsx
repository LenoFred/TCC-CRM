import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Family {
  id?: number;
  familyName: string;
  members: FamilyMember[];
  memberCount: number;
  createdDate: string;
}

interface AddEditFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (family: Family) => void;
  family?: Family | null;
  mode: 'add' | 'edit';
}

// Mock members data - in real app this would come from API
const mockMembers = [
  { id: 1, name: "John Smith", email: "john.smith@email.com" },
  { id: 2, name: "Jane Smith", email: "jane.smith@email.com" },
  { id: 3, name: "Tommy Smith", email: "tommy.smith@email.com" },
  { id: 4, name: "Sarah Smith", email: "sarah.smith@email.com" },
  { id: 5, name: "Mary Johnson", email: "mary.j@email.com" },
  { id: 6, name: "Robert Johnson", email: "robert.j@email.com" },
  { id: 7, name: "Emily Johnson", email: "emily.j@email.com" },
  { id: 8, name: "David Wilson", email: "d.wilson@email.com" },
  { id: 9, name: "Sarah Wilson", email: "s.wilson@email.com" },
];

const familyRoles = [
  { value: "head", label: "Head of Family" },
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "grandparent", label: "Grandparent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other Relative" },
];

export function AddEditFamilyModal({ isOpen, onClose, onSave, family, mode }: AddEditFamilyModalProps) {
  const { toast } = useToast();
  const [familyName, setFamilyName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<FamilyMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (family && mode === 'edit') {
      setFamilyName(family.familyName);
      setSelectedMembers(family.members);
    } else {
      setFamilyName("");
      setSelectedMembers([]);
    }
  }, [family, mode, isOpen]);

  const availableMembers = mockMembers.filter(member => 
    !selectedMembers.some(selected => selected.id === member.id) &&
    (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addMemberToFamily = (member: any) => {
    const newFamilyMember: FamilyMember = {
      ...member,
      role: "child" // Default role
    };
    setSelectedMembers([...selectedMembers, newFamilyMember]);
    setSearchTerm("");
  };

  const removeMemberFromFamily = (memberId: number) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== memberId));
  };

  const updateMemberRole = (memberId: number, role: string) => {
    setSelectedMembers(selectedMembers.map(member => 
      member.id === memberId ? { ...member, role } : member
    ));
  };

  const handleSave = () => {
    if (!familyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a family name.",
        variant: "destructive",
      });
      return;
    }

    const familyData: Family = {
      id: family?.id || Date.now(),
      familyName,
      members: selectedMembers,
      memberCount: selectedMembers.length,
      createdDate: family?.createdDate || new Date().toISOString().split('T')[0]
    };

    onSave(familyData);
    
    toast({
      title: mode === 'add' ? "Family Added" : "Family Updated",
      description: `${familyName} has been ${mode === 'add' ? 'created' : 'updated'} successfully.`,
    });
    
    onClose();
    
    // Reset form
    setFamilyName("");
    setSelectedMembers([]);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Family' : `Edit Family: ${family?.familyName}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Family Name */}
          <div>
            <Label htmlFor="familyName">Family Name *</Label>
            <Input
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., Smith Family"
            />
          </div>

          {/* Current Family Members */}
          {selectedMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members ({selectedMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={member.role} 
                        onValueChange={(value) => updateMemberRole(member.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {familyRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMemberFromFamily(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Family Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="memberSearch">Search Members</Label>
                <Input
                  id="memberSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                />
              </div>

              {searchTerm && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableMembers.length > 0 ? (
                    availableMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMemberToFamily(member)}
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No members found matching "{searchTerm}"
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'add' ? 'Create Family' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}