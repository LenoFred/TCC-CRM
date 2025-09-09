import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Filter[]) => void;
  title?: string;
  fields?: Array<{ value: string; label: string }>;
}

const defaultFields = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "status", label: "Status" },
  { value: "joinDate", label: "Join Date" },
  { value: "family", label: "Family" },
];

const operators = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts with" },
  { value: "endsWith", label: "Ends with" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
];

export const FilterModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  title = "Filter Results",
  fields = defaultFields 
}: FilterModalProps) => {
  const [filters, setFilters] = useState<Filter[]>([
    { id: '1', field: '', operator: '', value: '' }
  ]);

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: ''
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const removeFilter = (id: string) => {
    if (filters.length > 1) {
      setFilters(prev => prev.filter(f => f.id !== id));
    }
  };

  const updateFilter = (id: string, key: keyof Filter, value: string) => {
    setFilters(prev => prev.map(f => 
      f.id === id ? { ...f, [key]: value } : f
    ));
  };

  const handleApply = () => {
    const validFilters = filters.filter(f => f.field && f.operator);
    onApply(validFilters);
    onClose();
  };

  const handleClear = () => {
    setFilters([{ id: '1', field: '', operator: '', value: '' }]);
  };

  const canRemoveFilter = (id: string) => {
    return filters.length > 1;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filter Conditions</h3>
              <Button
                onClick={addFilter}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Filter
              </Button>
            </div>

            {filters.map((filter, index) => (
              <div key={filter.id} className="p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index === 0 ? 'Where' : 'And'}
                  </span>
                  {canRemoveFilter(filter.id) && (
                    <Button
                      onClick={() => removeFilter(filter.id)}
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Field</Label>
                    <Select 
                      value={filter.field} 
                      onValueChange={(value) => updateFilter(filter.id, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Condition</Label>
                    <Select 
                      value={filter.operator} 
                      onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Value</Label>
                    <Input
                      placeholder="Enter value"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                      disabled={filter.operator === 'isEmpty' || filter.operator === 'isNotEmpty'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Filter Preview:</h4>
            <p className="text-sm text-muted-foreground">
              {filters.length === 0 || !filters.some(f => f.field && f.operator) 
                ? "No filters applied - showing all results"
                : filters
                    .filter(f => f.field && f.operator)
                    .map((f, i) => 
                      `${i === 0 ? '' : 'AND '}${fields.find(field => field.value === f.field)?.label || f.field} ${operators.find(op => op.value === f.operator)?.label.toLowerCase() || f.operator}${f.value && !['isEmpty', 'isNotEmpty'].includes(f.operator) ? ` "${f.value}"` : ''}`
                    )
                    .join(' ')
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClear}
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};