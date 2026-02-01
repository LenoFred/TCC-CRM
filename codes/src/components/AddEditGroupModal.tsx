import { useState, useEffect } from "react";
import { X, Search, Check, Plus, Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

interface Group {
  id?: string;
  name: string;
  type: 'Department' | 'Ministry' | 'Committee' | 'Small Group' | 'General';
  description?: string;
  leader?: string; // This will be leaderMemberID from backend
  leaderContact?: string;
  members: string[];
  location?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  assistantLeader?: string; // New field
  pastor?: string; // New field
  classType?: string;
}

interface AddEditGroupModalProps {
  group?: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: any) => void;
  isEdit?: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface GroupMember {
  memberID: string;
  groupMemberID?: string; // ID of the GroupMembers record (for deletion)
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
}

export const AddEditGroupModal = ({ 
  group, 
  isOpen, 
  onClose, 
  onSave, 
  isEdit = false 
}: AddEditGroupModalProps) => {
  const { toast } = useToast();
  const [searchLeader, setSearchLeader] = useState("");
  const [searchAssistantLeader, setSearchAssistantLeader] = useState("");
  const [searchPastor, setSearchPastor] = useState("");
  const [searchMember, setSearchMember] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<Member | null>(null);
    const [selectedAssistantLeader, setSelectedAssistantLeader] = useState<Member | null>(null);
    const [selectedPastor, setSelectedPastor] = useState<Member | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<GroupMember[]>([]);
  const [existingMemberIDs, setExistingMemberIDs] = useState<string[]>([]); // Track original member IDs
  const [originalMembers, setOriginalMembers] = useState<GroupMember[]>([]); // Track original members with groupMemberID
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [formData, setFormData] = useState<Omit<Group, 'id'>>({
    name: "",
    type: "Ministry",
    description: "",
    leader: "",
    assistantLeader: "", // New field
    pastor: "", // New field
    leaderContact: "",
    members: [],
    location: "",
    status: "Active",
    classType: "none",
    createdDate: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch members from backend
  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await api.members.getAll();
      const membersData = response.data || [];
      
      const transformedMembers: Member[] = membersData.map((member: any) => ({
        id: member.memberID || member.id,
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
        email: member.email || '',
        phone: member.phoneNumber || member.phone || '',
      }));
      
      setAvailableMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members list",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchExistingGroupMembers = async (groupId: string) => {
    try {
      console.log('🔍 Fetching existing members for group:', groupId);
      // Use groupMembers.getByGroup to get groupMemberID for deletion
      const response = await api.groupMembers.getByGroup(groupId);
      console.log('📥 Raw response from getByGroup:', response);
      
      const resAny = response as any;
      const membersRaw = resAny?.members || resAny?.data?.members || resAny?.data || [];
      const membersData = Array.isArray(membersRaw) ? membersRaw : [];
      console.log('👥 Members data:', membersData);
      
      const transformedMembers: GroupMember[] = membersData.map((gm: any) => ({
        memberID: gm.member?.memberID || gm.memberID,
        groupMemberID: gm.groupMemberID, // Store for deletion
        firstName: gm.member?.firstName || '',
        lastName: gm.member?.lastName || '',
        email: gm.member?.email || '',
        phoneNumber: gm.member?.phoneNumber || '',
      }));
      
      console.log('✅ Transformed members:', transformedMembers);
      
      // Store both the members and their IDs
      setSelectedMembers(transformedMembers);
      setOriginalMembers(transformedMembers); // Keep a copy with groupMemberIDs
      setExistingMemberIDs(transformedMembers.map(m => m.memberID));
      console.log('✅ Set selectedMembers count:', transformedMembers.length);
    } catch (error) {
      console.error('❌ Error fetching group members:', error);
      toast({
        title: "Error Loading Members",
        description: "Could not load existing group members. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isEdit && group) {
      console.log('📝 EDIT MODE: Setting up form with group:', group);
      
      setFormData({
        name: group.name,
        type: group.type,
        description: group.description || "",
        leader: group.leader || "", // This is leaderMemberID from backend
        assistantLeader: group.assistantLeader || "",
        pastor: group.pastor || "",
        leaderContact: group.leaderContact || "",
        members: group.members || [],
        location: group.location || "",
        status: group.status,
        classType: group.classType || 'none',
        createdDate: group.createdDate
      });
      
      // Find and set the selected leader if available
      if (group.leader && availableMembers.length > 0) {
        const leader = availableMembers.find(m => m.id === group.leader);
        if (leader) {
          setSelectedLeader(leader);
          console.log('✅ Found and set leader:', leader.name);
        }
      }

      if (group.assistantLeader && availableMembers.length > 0) {
        const asst = availableMembers.find(m => m.id === group.assistantLeader);
        if (asst) {
          setSelectedAssistantLeader(asst);
          console.log('✅ Found and set assistant leader:', asst.name);
        }
      }

      if (group.pastor && availableMembers.length > 0) {
        const pastorMember = availableMembers.find(m => m.id === group.pastor);
        if (pastorMember) {
          setSelectedPastor(pastorMember);
          console.log('✅ Found and set pastor:', pastorMember.name);
        }
      }
      
      // Fetch existing group members with their groupMemberIDs
      if (group.id) {
        console.log('🔄 Calling fetchExistingGroupMembers with ID:', group.id);
        fetchExistingGroupMembers(group.id);
      } else {
        console.warn('⚠️ No group.id found for fetching members');
      }
    } else if (!isEdit) {
      setFormData({
        name: "",
        type: "Ministry",
        description: "",
        leader: "",
        assistantLeader: "",
        pastor: "",
        leaderContact: "",
        members: [],
        location: "",
        status: "Active",
        classType: "none",
        createdDate: new Date().toISOString().split('T')[0]
      });
      setSelectedLeader(null);
      setSelectedAssistantLeader(null);
      setSelectedPastor(null);
      setSelectedMembers([]);
      setExistingMemberIDs([]); // Reset for new group
    }
    setErrors({});
  }, [group, isEdit, isOpen, availableMembers]);
  
  // Debug: Log when selectedMembers changes
  useEffect(() => {
    console.log('👥 selectedMembers updated, count:', selectedMembers.length, selectedMembers);
  }, [selectedMembers]);
  
  // Filter available members for member selection (exclude leader and already selected members)
  const availableMembersForGroup = availableMembers.filter(member => {
    const isNotLeader = member.id !== selectedLeader?.id;
    const isNotSelected = !selectedMembers.some(selected => selected.memberID === member.id);
    const matchesSearch = searchMember ? (
      member.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      member.email.toLowerCase().includes(searchMember.toLowerCase())
    ) : false;
    return isNotLeader && isNotSelected && matchesSearch;
  });
  
  const addMemberToGroup = (member: Member) => {
    // Check if member is already in the group
    const isDuplicate = selectedMembers.some(selected => selected.memberID === member.id);
    
    if (isDuplicate) {
      toast({
        title: "Member Already in Group",
        description: `${member.name} is already a member of this group.`,
        variant: "destructive",
      });
      return;
    }
    
    const [firstName, ...lastNameParts] = member.name.split(' ');
    const newGroupMember: GroupMember = {
      memberID: member.id,
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      email: member.email || '',
      phoneNumber: member.phone || '',
    };
    setSelectedMembers([...selectedMembers, newGroupMember]);
    setSearchMember("");
  };
  
  const removeMemberFromGroup = (memberID: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.memberID !== memberID));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    }

    if (!formData.type) {
      newErrors.type = "Group type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Validate that a leader is selected
    if (!selectedLeader) {
      toast({
        title: "Validation Error",
        description: "Please select a group leader.",
        variant: "destructive",
      });
      return;
    }

    // Validate that an assistant leader is selected
    if (!selectedAssistantLeader) {
      toast({
        title: "Validation Error",
        description: "Please select an assistant leader for the group.",
        variant: "destructive",
      });
      return;
    }

    // Validate that a pastor is selected
    if (!selectedPastor) {
      toast({
        title: "Validation Error",
        description: "Please select a pastor for the group.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that at least one member is added (only for new group creation)
    if (!isEdit && selectedMembers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one member to the group.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For edit mode, identify members to add and remove
      let membersToAdd: GroupMember[] = [];
      let membersToRemove: GroupMember[] = [];
      
      if (isEdit) {
        // Members to add: in selectedMembers but not in existingMemberIDs
        membersToAdd = selectedMembers.filter(member => !existingMemberIDs.includes(member.memberID));
        
        // Members to remove: in originalMembers but not in current selectedMembers
        const currentMemberIDs = selectedMembers.map(m => m.memberID);
        membersToRemove = originalMembers.filter(member => !currentMemberIDs.includes(member.memberID));
      } else {
        membersToAdd = selectedMembers;
      }
      
      console.log('=== FORM SUBMIT ===');
      console.log('Is Edit Mode:', isEdit);
      console.log('Original Members:', originalMembers.map(m => `${m.memberID} (${m.groupMemberID})`));
      console.log('Selected Members:', selectedMembers.map(m => m.memberID));
      console.log('Members to Add:', membersToAdd.map(m => m.memberID));
      console.log('Members to Remove:', membersToRemove.map(m => `${m.memberID} (${m.groupMemberID})`));
      
    const normalizedClassType = formData.classType === 'none' ? '' : formData.classType;

    // Prepare group data with members
    const groupData = {
      ...formData,
        classType: normalizedClassType,
      leader: selectedLeader ? selectedLeader.id : '',
      assistantLeader: selectedAssistantLeader ? selectedAssistantLeader.id : '',
      pastor: selectedPastor ? selectedPastor.id : '',
        members: membersToAdd,
        removedMembers: membersToRemove,
        memberCount: selectedMembers.length, // Total count includes existing + new
      };
      
      // Pass data directly to parent - parent will handle API call and member associations
      onSave(groupData);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'add'} group. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleLeaderChange = (leaderId: string) => {
    const selectedMember = availableMembers.find(m => m.id === leaderId);
    if (selectedMember) {
      setSelectedLeader(selectedMember);
      setFormData(prev => ({
        ...prev,
        leader: selectedMember.id, // Store member ID, not name
        leaderContact: selectedMember.phone
      }));
    }
  };

  // Handler for Assistant Leader selection
  const handleAssistantLeaderChange = (assistantLeaderId: string) => {
    const selectedMember = availableMembers.find(m => m.id === assistantLeaderId);
    if (selectedMember) {
      setSelectedAssistantLeader(selectedMember);
      setFormData(prev => ({
        ...prev,
        assistantLeader: selectedMember.id
      }));
    }
  };

  // Handler for Pastor selection
  const handlePastorChange = (pastorId: string) => {
    const selectedMember = availableMembers.find(m => m.id === pastorId);
    if (selectedMember) {
      setSelectedPastor(selectedMember);
      setFormData(prev => ({
        ...prev,
        pastor: selectedMember.id
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {isEdit ? 'Edit Group' : 'Add New Group'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Configure your group details and leadership
              </DialogDescription>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                1
              </div>
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter group name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Group Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ministry">Ministry</SelectItem>
                    <SelectItem value="Department">Department</SelectItem>
                    <SelectItem value="Cell">Cell</SelectItem>
                    <SelectItem value="Fellowship">Fellowship</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Meeting Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter meeting location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter group description"
                rows={3}
              />
            </div>
          </div>

          {/* Class Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Class Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classType">Class Type</Label>
                <Select value={formData.classType || "none"} onValueChange={(value) => handleInputChange('classType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Foundational">Foundational</SelectItem>
                    <SelectItem value="CLDS">CLDS</SelectItem>
                    <SelectItem value="GBIC">GBIC</SelectItem>
                    <SelectItem value="ABIC">ABIC</SelectItem>
                    <SelectItem value="Baptism">Baptism</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Leadership Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                2
              </div>
              <h3 className="text-lg font-semibold">Leadership</h3>
            </div>

            {/* Group Leader */}
            <div className="space-y-2">
              <Label>Group Leader</Label>
              {selectedLeader ? (
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{selectedLeader.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedLeader.email || 'No email'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLeader(null);
                          setFormData(prev => ({ ...prev, leader: '', leaderContact: '' }));
                        }}
                        title="Remove leader"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <Input
                    value={searchLeader}
                    onChange={(e) => setSearchLeader(e.target.value)}
                    placeholder="Search by name or email..."
                    disabled={isLoadingMembers}
                  />
                  {searchLeader && !isLoadingMembers && (
                    <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                      {availableMembers
                        .filter(member =>
                          member.name.toLowerCase().includes(searchLeader.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchLeader.toLowerCase())
                        )
                        .map(member => (
                          <div key={member.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLeaderChange(member.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      {availableMembers.filter(member =>
                        member.name.toLowerCase().includes(searchLeader.toLowerCase()) ||
                        member.email.toLowerCase().includes(searchLeader.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members found matching "{searchLeader}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assistant Leader */}
            <div className="space-y-2">
              <Label>Assistant Leader</Label>
              {selectedAssistantLeader ? (
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{selectedAssistantLeader.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedAssistantLeader.email || 'No email'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAssistantLeader(null);
                          setFormData(prev => ({ ...prev, assistantLeader: '' }));
                        }}
                        title="Remove assistant leader"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <Input
                    value={searchAssistantLeader}
                    onChange={(e) => setSearchAssistantLeader(e.target.value)}
                    placeholder="Search by name or email..."
                    disabled={isLoadingMembers}
                  />
                  {searchAssistantLeader && !isLoadingMembers && (
                    <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                      {availableMembers
                        .filter(member =>
                          member.name.toLowerCase().includes(searchAssistantLeader.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchAssistantLeader.toLowerCase())
                        )
                        .map(member => (
                          <div key={member.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssistantLeaderChange(member.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      {availableMembers.filter(member =>
                        member.name.toLowerCase().includes(searchAssistantLeader.toLowerCase()) ||
                        member.email.toLowerCase().includes(searchAssistantLeader.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members found matching "{searchAssistantLeader}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pastor */}
            <div className="space-y-2">
              <Label>Pastor</Label>
              {selectedPastor ? (
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{selectedPastor.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPastor.email || 'No email'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPastor(null);
                          setFormData(prev => ({ ...prev, pastor: '' }));
                        }}
                        title="Remove pastor"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <Input
                    value={searchPastor}
                    onChange={(e) => setSearchPastor(e.target.value)}
                    placeholder="Search by name or email..."
                    disabled={isLoadingMembers}
                  />
                  {searchPastor && !isLoadingMembers && (
                    <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                      {availableMembers
                        .filter(member =>
                          member.name.toLowerCase().includes(searchPastor.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchPastor.toLowerCase())
                        )
                        .map(member => (
                          <div key={member.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePastorChange(member.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      {availableMembers.filter(member =>
                        member.name.toLowerCase().includes(searchPastor.toLowerCase()) ||
                        member.email.toLowerCase().includes(searchPastor.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members found matching "{searchPastor}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Group Members */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                3
              </div>
              <h3 className="text-lg font-semibold">Group Members</h3>
            </div>
            
            {/* Warning when no members selected */}
            {!isEdit && selectedMembers.length === 0 && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    No members added yet. Please add at least one member to create this group.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Add Members Card - At the top */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-5 w-5" />
                  Add Group Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="memberSearch">Search Members</Label>
                  <Input
                    id="memberSearch"
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    placeholder="Search by name or email..."
                    disabled={isLoadingMembers}
                  />
                </div>

                {isLoadingMembers && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading members...
                  </p>
                )}

                {searchMember && !isLoadingMembers && (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableMembersForGroup.length > 0 ? (
                      availableMembersForGroup.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addMemberToGroup(member)}
                          >
                            Add
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No members found matching "{searchMember}"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Selected Members Display - Below search */}
            {selectedMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" />
                    Selected Members ({selectedMembers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedMembers.map((member) => (
                    <div key={member.memberID} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMemberFromGroup(member.memberID)}
                        title="Remove from group"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEdit ? 'Update Group' : 'Add Group'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}