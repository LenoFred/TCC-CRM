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
import { api } from "@/config/api";

interface FamilyMember {
  memberID: string;
  firstName: string;
  lastName: string;
  email?: string;
  familyRole: string;
}

interface Family {
  id?: number;
  familyID?: string;
  familyName: string;
  members?: FamilyMember[];
  memberCount?: number;
  createdDate?: string;
}

interface AddEditFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (family: any) => Promise<any>; // Changed to return Promise with family data
  family?: any | null;
  mode: 'add' | 'edit';
}

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
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all members from API
  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await api.members.getAll();
      const membersData = response?.data || [];
      setAllMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (family && mode === 'edit') {
      setFamilyName(family.familyName || '');
      // Map family members to the correct format
      if (family.members && Array.isArray(family.members)) {
        const mappedMembers = family.members.map((member: any) => ({
          memberID: member.memberID,
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          email: member.email || '',
          familyRole: member.familyRole || 'child',
        }));
        setSelectedMembers(mappedMembers);
      }
    } else {
      setFamilyName("");
      setSelectedMembers([]);
    }
    setSearchTerm("");
  }, [family, mode, isOpen]);

  // Filter available members: 
  // 1. Exclude already selected ones
  // 2. Only show members WITHOUT a FamilyID (not already in another family)
  // 3. Apply search filter
  const availableMembers = allMembers.filter(member => {
    const isNotSelected = !selectedMembers.some(selected => selected.memberID === member.memberID);
    const hasNoFamily = !member.familyID || member.familyID === '' || member.familyID === null;
    const matchesSearch = searchTerm ? (
      (member.firstName && member.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.lastName && member.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : false;
    return isNotSelected && hasNoFamily && matchesSearch;
  });

  const addMemberToFamily = async (member: any) => {
    const newFamilyMember: FamilyMember = {
      memberID: member.memberID,
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      familyRole: 'child', // Default role
    };
    setSelectedMembers([...selectedMembers, newFamilyMember]);
    setSearchTerm("");
    
    // If editing, immediately update the member's FamilyID in the backend
    if (mode === 'edit' && family?.familyID) {
      try {
        await api.members.update(member.memberID, {
          familyID: family.familyID,
          familyRole: 'child',
        });
        toast({
          title: "Member Added",
          description: `${member.firstName} ${member.lastName} has been added to the family.`,
        });
      } catch (error) {
        console.error('Error updating member:', error);
        toast({
          title: "Warning",
          description: "Member added to list but not yet saved to sheet. Click Save Changes.",
          variant: "destructive",
        });
      }
    }
  };

  const removeMemberFromFamily = async (memberID: string) => {
    const memberToRemove = selectedMembers.find(m => m.memberID === memberID);
    setSelectedMembers(selectedMembers.filter(member => member.memberID !== memberID));
    
    // If editing, immediately update the member's FamilyID to empty in the backend
    if (mode === 'edit' && memberToRemove) {
      try {
        await api.members.update(memberID, {
          familyID: '',
          familyRole: '',
        });
        toast({
          title: "Member Removed",
          description: `${memberToRemove.firstName} ${memberToRemove.lastName} has been removed from the family.`,
        });
      } catch (error) {
        console.error('Error removing member:', error);
        toast({
          title: "Warning",
          description: "Member removed from list but change not yet saved to sheet.",
          variant: "destructive",
        });
      }
    }
  };

  const updateMemberRole = async (memberID: string, role: string) => {
    setSelectedMembers(selectedMembers.map(member => 
      member.memberID === memberID ? { ...member, familyRole: role } : member
    ));
    
    // If editing, immediately update the member's role in the backend
    if (mode === 'edit') {
      try {
        await api.members.update(memberID, {
          familyRole: role,
        });
      } catch (error) {
        console.error('Error updating member role:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!familyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a family name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const familyData: any = {
        familyName: familyName.trim(),
        memberCount: selectedMembers.length,
        members: selectedMembers, // Pass members to parent
      };

      // If editing, include the familyID
      if (family && mode === 'edit') {
        familyData.familyID = (family as any).familyID || family.id;
      }

      console.log('=== SAVING FAMILY FROM MODAL ===');
      console.log('Mode:', mode);
      console.log('Family data to save:', familyData);
      console.log('Selected members:', selectedMembers);

      // Save the family first - this will return the created/updated family with ID
      const savedFamily: any = await onSave(familyData);
      
      // Get the familyID from the saved family (for both add and edit modes)
      const familyIDToUse = savedFamily?.familyID || familyData.familyID;
      
      console.log('Family ID to use for member associations:', familyIDToUse);

      // Update all member associations with FamilyID and FamilyRole
      if (familyIDToUse && selectedMembers.length > 0) {
        const updatePromises = selectedMembers.map(member => 
          api.members.update(member.memberID, {
            familyID: familyIDToUse,
            familyRole: member.familyRole,
          })
        );
        
        await Promise.all(updatePromises);
        
        console.log('All member associations updated successfully');
        
        toast({
          title: mode === 'add' ? "Family Created" : "Family Updated",
          description: `${familyName} has been ${mode === 'add' ? 'created' : 'updated'} with ${selectedMembers.length} member(s).`,
        });
      } else {
        toast({
          title: mode === 'add' ? "Family Created" : "Family Updated",
          description: `${familyName} has been ${mode === 'add' ? 'created' : 'updated'} successfully.`,
        });
      }
      
      onClose();
      
      // Reset form
      setFamilyName("");
      setSelectedMembers([]);
      setSearchTerm("");
    } catch (error: any) {
      console.error('Error saving family:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save family",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
                  <div key={member.memberID} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={member.familyRole} 
                        onValueChange={(value) => updateMemberRole(member.memberID, value)}
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
                        onClick={() => removeMemberFromFamily(member.memberID)}
                        title="Remove from family"
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
                  disabled={isLoadingMembers}
                />
              </div>

              {isLoadingMembers && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading members...
                </p>
              )}

              {searchTerm && !isLoadingMembers && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableMembers.length > 0 ? (
                    availableMembers.map((member) => (
                      <div key={member.memberID} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
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
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (mode === 'add' ? 'Create Family' : 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}