import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id?: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  jobTitle?: string;
  appointmentDate?: string;
  lastLogin: string;
  permissionCount: number;
}

interface AddEditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: StaffMember) => void;
  staffMember?: StaffMember | null;
  mode: 'add' | 'edit';
}

export function AddEditStaffModal({ isOpen, onClose, onSave, staffMember, mode }: AddEditStaffModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: staffMember?.name || "",
    email: staffMember?.email || "",
    role: staffMember?.role || "",
    status: staffMember?.status || "Active",
    phone: staffMember?.phone || "",
    jobTitle: staffMember?.jobTitle || "",
    appointmentDate: staffMember?.appointmentDate || "",
  });

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const staffData: StaffMember = {
      ...formData,
      id: staffMember?.id || Date.now(),
      name: formData.name!,
      email: formData.email!,
      role: formData.role!,
      status: formData.status!,
      lastLogin: staffMember?.lastLogin || new Date().toISOString().split('T')[0],
      permissionCount: staffMember?.permissionCount || 0,
      phone: formData.phone || "",
      jobTitle: formData.jobTitle || formData.role,
      appointmentDate: formData.appointmentDate || new Date().toISOString().split('T')[0],
    };

    onSave(staffData);
    
    toast({
      title: mode === 'add' ? "Staff Added" : "Staff Updated",
      description: `${formData.name} has been ${mode === 'add' ? 'added' : 'updated'} successfully.`,
    });
    
    onClose();
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      role: "",
      status: "Active",
      phone: "",
      jobTitle: "",
      appointmentDate: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Staff Member' : `Edit Staff: ${staffMember?.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Staff Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senior Pastor">Senior Pastor</SelectItem>
                  <SelectItem value="Assistant Pastor">Assistant Pastor</SelectItem>
                  <SelectItem value="Youth Pastor">Youth Pastor</SelectItem>
                  <SelectItem value="Worship Leader">Worship Leader</SelectItem>
                  <SelectItem value="Administrative Assistant">Administrative Assistant</SelectItem>
                  <SelectItem value="Secretary">Secretary</SelectItem>
                  <SelectItem value="Treasurer">Treasurer</SelectItem>
                  <SelectItem value="Deacon">Deacon</SelectItem>
                  <SelectItem value="Elder">Elder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Enter job title"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="appointmentDate">Appointment Date</Label>
            <Input
              id="appointmentDate"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'add' ? 'Add Staff Member' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}