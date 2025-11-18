import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

interface Gathering {
  gatheringID?: string;
  gatheringName: string;
  gatheringType: string;
  parentID: string;
  gatheringDate: string;
  gatheringTime: string;
}

interface CreateGatheringModalProps {
  groupID?: string;
  groupName?: string;
  groupType?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  gathering?: any;
  isEdit?: boolean;
}

export const CreateGatheringModal = ({ 
  groupID,
  groupName,
  groupType,
  isOpen, 
  onClose, 
  onSave,
  gathering,
  isEdit = false
}: CreateGatheringModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<Gathering, 'gatheringID'>>({
    gatheringName: "",
    gatheringType: groupType || "",
    parentID: groupID || "",
    gatheringDate: new Date().toISOString().split('T')[0],
    gatheringTime: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Fetch all groups and extract unique group types
  useEffect(() => {
    if (isOpen && !groupID) {
      const fetchGroups = async () => {
        setIsLoadingGroups(true);
        try {
          console.log('=== CreateGatheringModal: Fetching groups ===');
          const response = await api.groups.getAll();
          console.log('CreateGatheringModal: Groups response:', response);
          
          const groupsData = response.data || [];
          console.log('CreateGatheringModal: Groups data:', groupsData);
          console.log('CreateGatheringModal: Groups count:', groupsData.length);
          
          if (groupsData.length > 0) {
            console.log('CreateGatheringModal: First group:', groupsData[0]);
          }
          
          setGroups(groupsData);
          
          // Extract unique group types from Groups sheet
          const types = [...new Set(groupsData
            .map((g: any) => g.groupType)
            .filter((type: string) => type && type.trim())
          )];
          console.log('CreateGatheringModal: Group types available:', types);
          setAvailableTypes(types);
        } catch (error) {
          console.error('CreateGatheringModal: Error fetching groups:', error);
          console.error('CreateGatheringModal: Error details:', error.message);
        } finally {
          setIsLoadingGroups(false);
        }
      };
      
      fetchGroups();
    }
  }, [isOpen, groupID]);

  // Filter groups by selected gathering type
  useEffect(() => {
    if (formData.gatheringType && groups.length > 0) {
      const filtered = groups.filter((group: any) => 
        group.groupType === formData.gatheringType
      );
      console.log('Filtering groups by type:', formData.gatheringType);
      console.log('Filtered groups:', filtered.map(g => ({ id: g.groupID, name: g.groupName, type: g.groupType })));
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups([]);
    }
  }, [formData.gatheringType, groups]);

  useEffect(() => {
    if (isOpen) {
      // Wait for groups to load before pre-filling in edit mode
      if (isEdit && gathering && !isLoadingGroups && groups.length > 0) {
        console.log('Pre-filling form with gathering data:', gathering);
        console.log('Available groups:', groups.map(g => ({ id: g.groupID, name: g.groupName, type: g.groupType })));
        // Pre-fill form with existing gathering data
        setFormData({
          gatheringName: gathering.gatheringName || "",
          gatheringType: gathering.gatheringType || "",
          parentID: gathering.parentID || "",
          gatheringDate: gathering.gatheringDate || new Date().toISOString().split('T')[0],
          gatheringTime: gathering.gatheringTime || "",
        });
        console.log('Form data set with parentID:', gathering.parentID);
      } else if (!isEdit) {
        // Reset form for new gathering
        setFormData({
          gatheringName: "",
          gatheringType: groupType || "",
          parentID: groupID || "",
          gatheringDate: new Date().toISOString().split('T')[0],
          gatheringTime: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, groupID, groupType, gathering, isEdit, isLoadingGroups, groups]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.gatheringName.trim()) {
      newErrors.gatheringName = "Gathering name is required";
    }

    if (!formData.gatheringType.trim()) {
      newErrors.gatheringType = "Gathering type is required";
    }

    if (!formData.parentID.trim()) {
      newErrors.parentID = "Group selection is required";
    }

    if (!formData.gatheringDate) {
      newErrors.gatheringDate = "Date is required";
    }

    if (!formData.gatheringTime) {
      newErrors.gatheringTime = "Time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEdit && gathering?.gatheringID) {
        // Update existing gathering
        await api.gatherings.update(gathering.gatheringID, formData);
        
        toast({
          title: "Gathering updated successfully",
          description: `${formData.gatheringName} has been updated.`,
        });
      } else {
        // Create new gathering
        await api.gatherings.create(formData);
        
        toast({
          title: "Gathering created successfully",
          description: `${formData.gatheringName} has been scheduled.`,
        });
      }
      
      if (onSave) {
        onSave();
      }
      
      onClose();
    } catch (error: any) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} gathering:`, error);
      toast({
        title: "Error",
        description: error?.message || `Failed to ${isEdit ? 'update' : 'create'} gathering. Please try again.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold">
            {isEdit ? 'Edit Gathering' : (groupName ? `Create New Gathering - ${groupName}` : 'Create New Gathering')}
          </DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gathering Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gatheringName">Gathering Name *</Label>
                <Input
                  id="gatheringName"
                  value={formData.gatheringName}
                  onChange={(e) => handleInputChange('gatheringName', e.target.value)}
                  placeholder="Enter gathering name"
                  className={errors.gatheringName ? "border-destructive" : ""}
                />
                {errors.gatheringName && <p className="text-sm text-destructive">{errors.gatheringName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gatheringType">Gathering Type *</Label>
                {groupID ? (
                  <>
                    <Input
                      id="gatheringType"
                      value={formData.gatheringType}
                      onChange={(e) => handleInputChange('gatheringType', e.target.value)}
                      placeholder="Type (from group)"
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Type is automatically set from the group type
                    </p>
                  </>
                ) : (
                  <>
                    <Select
                      value={formData.gatheringType}
                      onValueChange={(value) => {
                        handleInputChange('gatheringType', value);
                        handleInputChange('parentID', ''); // Reset group selection
                      }}
                      disabled={isLoadingGroups}
                    >
                      <SelectTrigger className={errors.gatheringType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select group type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {isLoadingGroups ? 'Loading group types...' : 'No group types available'}
                          </div>
                        ) : (
                          availableTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.gatheringType && <p className="text-sm text-destructive">{errors.gatheringType}</p>}
                  </>
                )}
              </div>

              {!groupID && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="parentID">Select Group *</Label>
                  <Select
                    value={formData.parentID}
                    onValueChange={(value) => handleInputChange('parentID', value)}
                    disabled={!formData.gatheringType || isLoadingGroups}
                  >
                    <SelectTrigger className={errors.parentID ? "border-destructive" : ""}>
                      <SelectValue placeholder={
                        !formData.gatheringType 
                          ? "Select gathering type first" 
                          : filteredGroups.length === 0 
                            ? `No groups found with type "${formData.gatheringType}"` 
                            : "Select a group"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredGroups.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {isLoadingGroups ? 'Loading groups...' : `No groups with type "${formData.gatheringType}"`}
                        </div>
                      ) : (
                        filteredGroups.map((group) => (
                          <SelectItem key={group.groupID} value={group.groupID}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{group.groupName}</span>
                              <span className="text-xs text-muted-foreground">
                                {group.groupType} • {group.memberCount || 0} members
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.parentID && <p className="text-sm text-destructive">{errors.parentID}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="gatheringDate">Date *</Label>
                <Input
                  id="gatheringDate"
                  type="date"
                  value={formData.gatheringDate}
                  onChange={(e) => handleInputChange('gatheringDate', e.target.value)}
                  className={errors.gatheringDate ? "border-destructive" : ""}
                />
                {errors.gatheringDate && <p className="text-sm text-destructive">{errors.gatheringDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gatheringTime">Time *</Label>
                <Input
                  id="gatheringTime"
                  type="time"
                  value={formData.gatheringTime}
                  onChange={(e) => handleInputChange('gatheringTime', e.target.value)}
                  className={errors.gatheringTime ? "border-destructive" : ""}
                />
                {errors.gatheringTime && <p className="text-sm text-destructive">{errors.gatheringTime}</p>}
              </div>
            </div>

            {groupID && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Group:</strong> {groupName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Type:</strong> {groupType}
                </p>
              </div>
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
              {isSubmitting ? 'Creating...' : 'Create Gathering'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
