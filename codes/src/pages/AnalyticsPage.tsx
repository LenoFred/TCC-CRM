import { useState, useEffect } from "react";
import { BarChart, FileDown, Plus, X, TrendingUp, Table as TableIcon, AlertCircle, RefreshCw, Download } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { useGroupAccess } from "@/hooks/useGroupAccess";

// Define interface for the column metadata
interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  label: string;
}

interface Filter {
  id: number;
  field: string;
  operator: string;
  value: string;
}

const AnalyticsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const { getAccessDisplayText, userIsRestricted } = useGroupAccess();
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [reportResults, setReportResults] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnMetadata[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const onboarding = summaryStats?.onboarding;
  const [totalRecords, setTotalRecords] = useState(0);

  // Data sources that match Google Sheets
  const dataSources = [
    { value: "members", label: "Members", icon: "👥" },
    { value: "families", label: "Families", icon: "👨‍👩‍👧‍👦" },
    { value: "groups", label: "Groups", icon: "🤝" },
    { value: "groupMembers", label: "Group Members", icon: "👤" },
    { value: "gatherings", label: "Gatherings", icon: "📅" },
    { value: "attendance", label: "Attendance", icon: "✅" },
    { value: "donations", label: "Donations", icon: "💰" },
    { value: "guests", label: "Guests", icon: "🎫" },
    { value: "volunteerRoles", label: "Volunteer Roles", icon: "🎖️" },
    { value: "volunteerAssignments", label: "Volunteer Assignments", icon: "📋" },
    { value: "supportRequests", label: "Support Requests", icon: "🆘" },
    { value: "staff", label: "Staff", icon: "💼" },
    { value: "staffPermissions", label: "Staff Permissions", icon: "🔐" },
    { value: "logs", label: "Activity Logs", icon: "📝" }
  ];

  const operatorsByType = {
    string: [
      { value: "equals", label: "Equals" },
      { value: "not_equals", label: "Not Equals" },
      { value: "contains", label: "Contains" },
      { value: "not_contains", label: "Does Not Contain" },
      { value: "starts_with", label: "Starts With" },
      { value: "ends_with", label: "Ends With" },
      { value: "is_empty", label: "Is Empty" },
      { value: "is_not_empty", label: "Is Not Empty" }
    ],
    number: [
      { value: "equals", label: "Equals (=)" },
      { value: "not_equals", label: "Not Equals (≠)" },
      { value: "greater_than", label: "Greater Than (>)" },
      { value: "less_than", label: "Less Than (<)" },
      { value: "greater_equals", label: "Greater or Equal (≥)" },
      { value: "less_equals", label: "Less or Equal (≤)" }
    ],
    date: [
      { value: "equals", label: "On Date" },
      { value: "not_equals", label: "Not On Date" },
      { value: "after", label: "After" },
      { value: "before", label: "Before" },
      { value: "between", label: "Between (use comma: date1,date2)" }
    ],
    boolean: [
      { value: "is_true", label: "Is True" },
      { value: "is_false", label: "Is False" }
    ]
  };

  // Fetch summary stats on page load
  useEffect(() => {
    fetchSummaryStats();
  }, []);

  const fetchSummaryStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await api.analytics.getSummaryStats();
      setSummaryStats(response.data);
    } catch (error) {
      console.error('Error fetching summary stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch columns when data source changes
  useEffect(() => {
    if (selectedDataSource) {
      fetchColumns();
    } else {
      setAvailableColumns([]);
      setFilters([]);
      setReportResults([]);
      setReportError(null);
    }
  }, [selectedDataSource]);

  const fetchColumns = async () => {
    setIsLoadingColumns(true);
    try {
      const response = await api.analytics.getSheetColumns(selectedDataSource);
      setAvailableColumns(response.data);
      setFilters([]); // Reset filters when changing data source
      setReportResults([]);
      setReportError(null);
    } catch (error) {
      console.error('Error fetching columns:', error);
      toast({
        title: "Error",
        description: "Failed to load columns for this data source",
        variant: "destructive",
      });
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = availableColumns.find(col => col.name === fieldName);
    return field ? operatorsByType[field.type] : [];
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now(),
      field: "",
      operator: "",
      value: ""
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: number, updates: Partial<Filter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const generateReport = async () => {
    if (!selectedDataSource) {
      toast({
        title: "Select Data Source",
        description: "Please select a data source before generating a report",
        variant: "destructive",
      });
      return;
    }

    // Validate filters - ensure all have field, operator, and value (unless operator is is_empty/is_not_empty)
    const invalidFilters = filters.filter(f => 
      !f.field || 
      !f.operator || 
      (!f.value && !['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(f.operator))
    );

    if (invalidFilters.length > 0) {
      toast({
        title: "Invalid Filters",
        description: "Please complete all filter fields or remove incomplete filters",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    setReportError(null);
    
    try {
      const response = await api.analytics.generateReport({
        dataSource: selectedDataSource,
        filters: filters,
        outputFields: availableColumns.map(col => col.name),
        limit: 1000 // Limit to 1000 records for performance
      });
      
      setReportResults(response.data);
      setTotalRecords(response.total);
      setShowReportModal(true);
      
      toast({
        title: "Report Generated",
        description: `Found ${response.total} records${response.returned < response.total ? ` (showing first ${response.returned})` : ''}`,
      });
      
    } catch (error: any) {
      console.error('Error generating report:', error);
      setReportError(error.message || 'Failed to generate report');
      toast({
        title: "Report Generation Failed",
        description: error.message || "Please check your filters and try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportToCSV = async () => {
    if (reportResults.length === 0) {
      toast({
        title: "No Data",
        description: "Generate a report first before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const headers = Object.keys(reportResults[0]);
      const csvRows = [
        headers.join(','),
        ...reportResults.map(row =>
          headers.map(header => {
            const value = row[header];
            const escaped = String(value || '').replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const dataSourceLabel = dataSources.find(ds => ds.value === selectedDataSource)?.label || 'report';
      const timestamp = new Date().toISOString().slice(0, 10);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${dataSourceLabel}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Downloaded ${reportResults.length} records to CSV`,
      });
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report to CSV",
        variant: "destructive",
      });
    }
  };

  const getColumnLabel = (columnName: string) => {
    const column = availableColumns.find(col => col.name === columnName);
    return column?.label || columnName;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>

        {/* Group Access Notice */}
        {userIsRestricted && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Analytics Filtered by Group Access</AlertTitle>
            <AlertDescription className="text-blue-800">
              Your analytics are filtered to show data only from your assigned groups: <strong>{getAccessDisplayText()}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Onboarding overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Onboarding Snapshot
            </CardTitle>
            <CardDescription>Track completion of Baptism, CLDS, GBIC, ABIC, and membership level</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold">{onboarding?.totalMembers ?? summaryStats?.members?.total ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Registered Members</p>
                    <p className="text-2xl font-bold">{onboarding?.registeredMembers ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Members (Not Registered)</p>
                    <p className="text-2xl font-bold">{onboarding?.members ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Baptism Done</p>
                    <p className="text-2xl font-bold">{onboarding?.baptismDone ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">CLDS Completed</p>
                    <p className="text-2xl font-bold">{onboarding?.cldsCompleted ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">GBIC / ABIC Completed</p>
                    <p className="text-sm font-semibold">GBIC: {onboarding?.gbicCompleted ?? 0} | ABIC: {onboarding?.abicCompleted ?? 0}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Custom Report Builder
            </CardTitle>
            <CardDescription>
              Select a data source, add filters, and generate custom reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Source Selection */}
            <div>
              <Label htmlFor="data-source">Select Data Source</Label>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a data source from Google Sheets" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      <div className="flex items-center gap-2">
                        <span>{source.icon}</span>
                        <span>{source.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Available Fields Info */}
            {selectedDataSource && !isLoadingColumns && availableColumns.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Available Fields ({availableColumns.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {availableColumns.slice(0, 10).map((col) => (
                    <Badge key={col.name} variant="secondary" className="text-xs">
                      {col.label}
                      <span className="ml-1 opacity-60">({col.type})</span>
                    </Badge>
                  ))}
                  {availableColumns.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{availableColumns.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Filters */}
            {selectedDataSource && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Label>Filters (Optional)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add filters to narrow down your results
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addFilter} 
                    className="gap-2"
                    disabled={isLoadingColumns || availableColumns.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    Add Filter
                  </Button>
                </div>

                {filters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No filters applied - all records will be returned</p>
                    <p className="text-xs mt-1">Click "Add Filter" to filter your results</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filters.map((filter, index) => (
                      <div key={filter.id} className="flex gap-3 items-start p-3 border rounded-lg bg-card">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Field Selection */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Field</Label>
                            <Select 
                              value={filter.field} 
                              onValueChange={(value) => updateFilter(filter.id, { field: value, operator: "", value: "" })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableColumns.map((column) => (
                                  <SelectItem key={column.name} value={column.name}>
                                    <div className="flex items-center justify-between gap-2 w-full">
                                      <span>{column.label}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {column.type}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator Selection */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Operator</Label>
                            <Select 
                              value={filter.operator} 
                              onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                              disabled={!filter.field}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {getOperatorsForField(filter.field).map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Value Input */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <Input
                              type="text"
                              placeholder={filter.operator.includes('between') ? 'value1,value2' : 'Enter value'}
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                              disabled={!filter.operator || ['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(filter.operator)}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilter(filter.id)}
                          className="mt-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generate Report Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={generateReport}
                disabled={!selectedDataSource || isGeneratingReport || isLoadingColumns}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {isGeneratingReport ? "Generating Report..." : "Generate Report"}
              </Button>
              
              {reportResults.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={exportToCSV}
                  className="gap-2"
                  disabled={isGeneratingReport || !hasPermission('can_generate_reports')}
                >
                  <FileDown className="h-4 w-4" />
                  Export to CSV ({reportResults.length} records)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Report Results Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Report Results</DialogTitle>
                <DialogDescription>
                  {reportResults.length} records
                  {totalRecords > reportResults.length && ` (showing first ${reportResults.length} of ${totalRecords})`}
                </DialogDescription>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
                disabled={!hasPermission('can_generate_reports')}
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto px-6 pb-6">
            {reportResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {Object.keys(reportResults[0]).map((key) => (
                      <TableHead key={key} className="font-semibold whitespace-nowrap bg-background">
                        {getColumnLabel(key)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportResults.map((result, index) => (
                    <TableRow key={index}>
                      {Object.keys(result).map((key) => (
                        <TableCell key={key} className="whitespace-nowrap">
                          {result[key] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
