import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BarChart3, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (reportData: any) => void;
}

const DATA_SOURCES = [
  { value: "members", label: "Members" },
  { value: "families", label: "Families" },
  { value: "donations", label: "Donations" },
  { value: "attendance", label: "Attendance" },
  { value: "volunteers", label: "Volunteers" },
  { value: "staff", label: "Staff" }
];

const MEMBER_FIELDS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "status", label: "Status" },
  { value: "joinDate", label: "Join Date" },
  { value: "family", label: "Family" },
  { value: "membershipType", label: "Membership Type" }
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts With" },
  { value: "greaterThan", label: "Greater Than" },
  { value: "lessThan", label: "Less Than" },
  { value: "inLastDays", label: "In Last N Days" },
  { value: "notInLastDays", label: "Not In Last N Days" }
];

export const ReportBuilderModal = ({ isOpen, onClose, onGenerate }: ReportBuilderModalProps) => {
  const { toast } = useToast();
  const [dataSource, setDataSource] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [outputFields, setOutputFields] = useState<string[]>([]);

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: "",
      operator: "",
      value: ""
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, field: keyof Filter, value: string) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    ));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const handleFieldToggle = (field: string) => {
    if (outputFields.includes(field)) {
      setOutputFields(outputFields.filter(f => f !== field));
    } else {
      setOutputFields([...outputFields, field]);
    }
  };

  const handleGenerate = () => {
    if (!dataSource) {
      toast({
        title: "Validation Error",
        description: "Please select a data source.",
        variant: "destructive",
      });
      return;
    }

    if (outputFields.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one output field.",
        variant: "destructive",
      });
      return;
    }

    const reportData = {
      dataSource,
      filters: filters.filter(f => f.field && f.operator && f.value),
      outputFields,
      timestamp: new Date().toISOString()
    };

    onGenerate(reportData);

    toast({
      title: "Report Generated",
      description: "Your custom report has been generated successfully.",
    });

    // Reset form
    setDataSource("");
    setFilters([]);
    setOutputFields([]);
    
    onClose();
  };

  const availableFields = dataSource === "members" ? MEMBER_FIELDS : MEMBER_FIELDS; // Extend for other data sources

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Custom Report Builder
          </DialogTitle>
          <DialogDescription>
            Build a custom report by selecting data source, filters, and output fields
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Data Source Selection */}
          <div>
            <Label htmlFor="dataSource">Primary Data Source *</Label>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select a data source" />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Filters</Label>
              <Button variant="outline" size="sm" onClick={addFilter} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Filter
              </Button>
            </div>
            
            <div className="space-y-3">
              {filters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Select 
                    value={filter.field} 
                    onValueChange={(value) => updateFilter(filter.id, "field", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filter.operator} 
                    onValueChange={(value) => updateFilter(filter.id, "operator", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                    className="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {filters.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No filters added. Click "Add Filter" to add criteria.
                </div>
              )}
            </div>
          </div>

          {/* Output Fields */}
          {dataSource && (
            <div>
              <Label className="text-base font-medium mb-3 block">Output Fields</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <label key={field.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outputFields.includes(field.value)}
                      onChange={() => handleFieldToggle(field.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-3">
                <Label className="text-sm text-muted-foreground">
                  Selected Fields ({outputFields.length})
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {outputFields.map((field) => {
                    const fieldLabel = availableFields.find(f => f.value === field)?.label;
                    return (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {fieldLabel}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};