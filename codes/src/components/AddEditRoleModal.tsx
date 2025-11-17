import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Role {
  roleID?: string;
  roleName: string;
  description: string;
}

interface AddEditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Role) => void;
  role?: Role | null;
  isEdit?: boolean;
}

export const AddEditRoleModal = ({ isOpen, onClose, onSave, role, isEdit = false }: AddEditRoleModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
  });

  useEffect(() => {
    if (role && isEdit) {
      setFormData({
        roleName: role.roleName || "",
        description: role.description || "",
      });
    } else {
      setFormData({
        roleName: "",
        description: "",
      });
    }
  }, [role, isEdit, isOpen]);

  const handleSubmit = () => {
    if (!formData.roleName.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const roleData: Role = {
      roleName: formData.roleName,
      description: formData.description,
    };

    onSave(roleData);

    if (!isEdit) {
      setFormData({
        roleName: "",
        description: "",
      });
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Volunteer Role" : "Add New Volunteer Role"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the volunteer role details." : "Create a new volunteer role for your church."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="roleName">Role Name *</Label>
            <Input
              id="roleName"
              placeholder="e.g., Usher, Greeter, Sound Tech"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="roleDescription">Description *</Label>
            <Textarea
              id="roleDescription"
              placeholder="Describe the duties and responsibilities of this role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Update Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};