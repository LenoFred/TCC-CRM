import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { api } from "@/config/api";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getAllStates, getLGAsByState } from "@/data/nigeria-states-lga";

interface Member {
  id?: number | string;
  memberID?: string; // Backend ID field
  firstName: string;
  surname: string;
  lastName?: string; // Backend field name
  otherNames?: string;
  email: string;
  phone: string;
  phoneNumber?: string; // Backend field name
  status: string;
  memberStatus?: string; // Backend field name
  joinDate: string;
  gender?: string;
  state?: string;
  lga?: string;
  lGA?: string; // Backend field name
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  dOB?: string; // Backend field name
  membershipType?: string;
  memberType?: string; // Backend field name
  familyId?: string;
  familyID?: string; // Backend field name
  family?: string;
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
    gender: "",
    membershipType: "Regular Member"
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [states] = useState<string[]>(getAllStates());

  useEffect(() => {
    if (isEdit && member) {
      console.log('Loading member for edit:', member);
      console.log('Member status:', member.status);
      console.log('Member state:', member.state);
      console.log('Member lga:', member.lga, 'Member lGA:', member.lGA);
      
      // Map backend field names to form field names
      const loadedData = {
        firstName: member.firstName || "",
        surname: member.surname || member.lastName || "",
        otherNames: member.otherNames || "",
        email: member.email || "",
        phone: member.phone || member.phoneNumber || "",
        status: member.status || "Active",  // Use status directly (not memberStatus)
        joinDate: member.joinDate || new Date().toISOString().split('T')[0],
        dateOfBirth: member.dateOfBirth || member.dOB || "",
        gender: member.gender || "",
        address: member.address || "",
        emergencyContact: member.emergencyContact || "",
        membershipType: member.membershipType || member.memberType || "Regular Member",
        state: member.state || "",
        lga: member.lga || member.lGA || ""
      };
      
      console.log('Form data being set:', loadedData);
      console.log('Status specifically:', loadedData.status);
      console.log('LGA specifically:', loadedData.lga);
      
      setFormData(loadedData);
      
      // Load LGAs for the state
      if (member.state) {
        const lgas = getLGAsByState(member.state);
        console.log('Available LGAs for state', member.state, ':', lgas);
        setAvailableLGAs(lgas);
        
        // Check if LGA is in the available LGAs
        const lgaValue = member.lga || member.lGA || "";
        if (lgaValue && !lgas.includes(lgaValue)) {
          console.warn('LGA value not found in available LGAs!', { lgaValue, lgas });
        } else if (lgaValue) {
          console.log('LGA value IS in available LGAs:', lgaValue);
        }
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
        gender: "",
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

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.state) {
      newErrors.state = "State is required";
    }

    // LGA is only required for new members, not when editing
    if (!isEdit && !formData.lga) {
      newErrors.lga = "LGA is required";
    }

    if (!formData.membershipType) {
      newErrors.membershipType = "Membership type is required";
    }

    if (!formData.emergencyContact?.trim()) {
      newErrors.emergencyContact = "Emergency contact is required";
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
      const dataToSave = {
        ...formData,
        id: isEdit ? member?.id : Date.now()
      };
      
      console.log('Form submitting with data:', dataToSave);
      console.log('Status field:', dataToSave.status);
      console.log('LGA field:', dataToSave.lga);
      console.log('State field:', dataToSave.state);
      
      onSave(dataToSave);

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
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={errors.dateOfBirth ? "border-destructive" : ""}
                />
                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
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
                <Label htmlFor="membershipType">Membership Type *</Label>
                <Select value={formData.membershipType} onValueChange={(value) => handleInputChange('membershipType', value)}>
                  <SelectTrigger className={errors.membershipType ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular Member">Regular Member</SelectItem>
                    <SelectItem value="Associate Member">Associate Member</SelectItem>
                    <SelectItem value="Youth Member">Youth Member</SelectItem>
                    <SelectItem value="Child Member">Child Member</SelectItem>
                  </SelectContent>
                </Select>
                {errors.membershipType && <p className="text-sm text-destructive">{errors.membershipType}</p>}
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
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lga">Local Government Area{!isEdit && ' *'}</Label>
                <Select 
                  value={formData.lga} 
                  onValueChange={(value) => handleInputChange('lga', value)}
                  disabled={!formData.state || availableLGAs.length === 0}
                >
                  <SelectTrigger className={errors.lga ? "border-destructive" : ""}>
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
                {errors.lga && <p className="text-sm text-destructive">{errors.lga}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={3}
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact *</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Name and phone number of emergency contact"
                className={errors.emergencyContact ? "border-destructive" : ""}
              />
              {errors.emergencyContact && <p className="text-sm text-destructive">{errors.emergencyContact}</p>}
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