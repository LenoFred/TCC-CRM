import { useState, useEffect } from "react";
import { Settings, Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CustomField {
  id: string;
  name: string;
  type: string;
  sheet: string;
  options?: string[];
  required: boolean;
}

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomFieldsModal = ({ isOpen, onClose }: CustomFieldsModalProps) => {
  const { toast } = useToast();
  const [selectedSheet, setSelectedSheet] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isAddingField, setIsAddingField] = useState(false);
  
  // New field form state
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState("");

  const availableSheets = [
    { value: "members", label: "Members" },
    { value: "families", label: "Families" },
    { value: "groups", label: "Groups" },
    { value: "donations", label: "Donations" },
    { value: "staff", label: "Staff" },
    { value: "events", label: "Events" },
  ];

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "boolean", label: "Yes/No" },
    { value: "dropdown", label: "Dropdown" },
    { value: "textarea", label: "Long Text" },
  ];

  // Mock data - would be fetched from API
  const mockCustomFields: Record<string, CustomField[]> = {
    members: [
      { id: "1", name: "Spiritual Gifts", type: "text", sheet: "members", required: false },
      { id: "2", name: "Baptism Date", type: "date", sheet: "members", required: false },
      { id: "3", name: "Ministry Interest", type: "dropdown", sheet: "members", options: ["Worship", "Youth", "Children", "Outreach"], required: false },
    ],
    families: [
      { id: "4", name: "Anniversary Date", type: "date", sheet: "families", required: false },
    ],
  };

  useEffect(() => {
    if (isOpen && selectedSheet) {
      setCustomFields(mockCustomFields[selectedSheet] || []);
    }
  }, [isOpen, selectedSheet]);

  const handleAddField = () => {
    if (!newFieldName.trim() || !newFieldType) {
      toast({
        title: "Missing Information",
        description: "Please provide field name and type.",
        variant: "destructive",
      });
      return;
    }

    if (newFieldType === "dropdown" && !dropdownOptions.trim()) {
      toast({
        title: "Missing Options",
        description: "Please provide dropdown options separated by commas.",
        variant: "destructive",
      });
      return;
    }

    const newField: CustomField = {
      id: Date.now().toString(),
      name: newFieldName,
      type: newFieldType,
      sheet: selectedSheet,
      required: newFieldRequired,
      options: newFieldType === "dropdown" ? dropdownOptions.split(",").map(opt => opt.trim()) : undefined,
    };

    setCustomFields(prev => [...prev, newField]);
    
    toast({
      title: "Field Added",
      description: `Custom field "${newFieldName}" has been added to ${selectedSheet}.`,
    });

    // Reset form
    setNewFieldName("");
    setNewFieldType("");
    setNewFieldRequired(false);
    setDropdownOptions("");
    setIsAddingField(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== fieldId));
    toast({
      title: "Field Removed",
      description: "Custom field has been removed.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Custom Fields
          </DialogTitle>
          <DialogDescription>
            Add custom fields to extend your data collection capabilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sheet Selection */}
          <div className="space-y-3">
            <Label>Select Sheet/Table</Label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sheet to manage custom fields" />
              </SelectTrigger>
              <SelectContent>
                {availableSheets.map((sheet) => (
                  <SelectItem key={sheet.value} value={sheet.value}>
                    {sheet.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSheet && (
            <>
              {/* Existing Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Custom Fields for {availableSheets.find(s => s.value === selectedSheet)?.label}
                  </h3>
                  <Button 
                    onClick={() => setIsAddingField(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                {customFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No custom fields added yet. Click "Add Field" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{field.name}</h4>
                            <Badge variant="secondary">{field.type}</Badge>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          {field.options && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Options: {field.options.join(", ")}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteField(field.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Field Form */}
              {isAddingField && (
                <div className="border rounded-lg p-6 bg-muted/20">
                  <h3 className="font-medium mb-4">Add New Custom Field</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fieldName">Field Name *</Label>
                        <Input
                          id="fieldName"
                          placeholder="e.g., Spiritual Gifts"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Type *</Label>
                        <Select value={newFieldType} onValueChange={setNewFieldType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {newFieldType === "dropdown" && (
                      <div className="space-y-2">
                        <Label htmlFor="dropdownOptions">Dropdown Options *</Label>
                        <Textarea
                          id="dropdownOptions"
                          placeholder="Enter options separated by commas (e.g., Option 1, Option 2, Option 3)"
                          value={dropdownOptions}
                          onChange={(e) => setDropdownOptions(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="required"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                      />
                      <Label htmlFor="required">Required field</Label>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleAddField}>
                        Add Field
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingField(false);
                          setNewFieldName("");
                          setNewFieldType("");
                          setNewFieldRequired(false);
                          setDropdownOptions("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
