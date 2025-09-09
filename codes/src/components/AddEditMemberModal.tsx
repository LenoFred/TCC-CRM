import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { getAllStates, getLGAsByState } from "@/data/nigeria-states-lga";

interface Member {
  id?: number;
  firstName: string;
  surname: string;
  otherNames?: string;
  email: string;
  phone: string;
  status: string;
  joinDate: string;
  state?: string;
  lga?: string;
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  membershipType?: string;
}

interface AddEditMemberModalProps {
  member?: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  isEdit?: boolean;
}

export const AddEditMemberModal = ({ 
  member, 
  isOpen, 
  onClose, 
  onSave, 
  isEdit = false 
}: AddEditMemberModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Member>({
    firstName: "",
    surname: "",
    otherNames: "",
    email: "",
    phone: "",
    status: "Active",
    joinDate: new Date().toISOString().split('T')[0],
    state: "",
    lga: "",
    address: "",
    emergencyContact: "",
    dateOfBirth: "",
    membershipType: "Regular Member"
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [states] = useState<string[]>(getAllStates());

  useEffect(() => {
    if (isEdit && member) {
      setFormData({
        ...member,
        dateOfBirth: member.dateOfBirth || "",
        address: member.address || "",
        emergencyContact: member.emergencyContact || "",
        membershipType: member.membershipType || "Regular Member",
        state: member.state || "",
        lga: member.lga || ""
      });
      if (member.state) {
        setAvailableLGAs(getLGAsByState(member.state));
      }
    } else if (!isEdit) {
      setFormData({
        firstName: "",
        surname: "",
        otherNames: "",
        email: "",
        phone: "",
        status: "Active",
        joinDate: new Date().toISOString().split('T')[0],
        state: "",
        lga: "",
        address: "",
        emergencyContact: "",
        dateOfBirth: "",
        membershipType: "Regular Member"
      });
      setAvailableLGAs([]);
    }
    setErrors({});
  }, [member, isEdit, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.surname.trim()) {
      newErrors.surname = "Surname is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.joinDate) {
      newErrors.joinDate = "Join date is required";
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave({
        ...formData,
        id: isEdit ? member?.id : Date.now()
      });
      
      toast({
        title: `Member ${isEdit ? 'updated' : 'added'} successfully`,
        description: `${formData.firstName} ${formData.surname} has been ${isEdit ? 'updated' : 'added'} to the system.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'add'} member. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Member, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    
    // Handle state change to update LGAs
    if (field === 'state') {
      const lgas = getLGAsByState(value);
      setAvailableLGAs(lgas);
      // Clear LGA selection when state changes
      setFormData(prev => ({ ...prev, lga: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold">
            {isEdit ? 'Edit Member' : 'Add New Member'}
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
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  placeholder="Enter surname"
                  className={errors.surname ? "border-destructive" : ""}
                />
                {errors.surname && <p className="text-sm text-destructive">{errors.surname}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherNames">Other Names</Label>
                <Input
                  id="otherNames"
                  value={formData.otherNames}
                  onChange={(e) => handleInputChange('otherNames', e.target.value)}
                  placeholder="Enter other names (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
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
                    <SelectItem value="Visitor">Visitor</SelectItem>
                    <SelectItem value="Guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="membershipType">Membership Type</Label>
                <Select value={formData.membershipType} onValueChange={(value) => handleInputChange('membershipType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular Member">Regular Member</SelectItem>
                    <SelectItem value="Associate Member">Associate Member</SelectItem>
                    <SelectItem value="Youth Member">Youth Member</SelectItem>
                    <SelectItem value="Child Member">Child Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date *</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleInputChange('joinDate', e.target.value)}
                  className={errors.joinDate ? "border-destructive" : ""}
                />
                {errors.joinDate && <p className="text-sm text-destructive">{errors.joinDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lga">Local Government Area</Label>
                <Select 
                  value={formData.lga} 
                  onValueChange={(value) => handleInputChange('lga', value)}
                  disabled={!formData.state || availableLGAs.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.state ? "Select state first" : 
                      availableLGAs.length === 0 ? "No LGAs available" : 
                      "Select LGA"
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableLGAs.map(lga => (
                      <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Name and phone number of emergency contact"
              />
            </div>
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
              {isSubmitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Member' : 'Add Member')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};