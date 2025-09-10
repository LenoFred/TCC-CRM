import { useState, useEffect } from "react";
import { BarChart, FileDown, Plus, Filter, TrendingUp, Table as TableIcon } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";

// Define interface for the column metadata
interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  label: string;
}

interface Sheet {
  id: string;
  name: string;
  columns: ColumnMetadata[];
}

const AnalyticsPage = () => {
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [filters, setFilters] = useState<Array<{id: number, field: string, operator: string, value: string}>>([]);
  const [reportResults, setReportResults] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnMetadata[]>([]);

  // Data sources based on schema
  const dataSources = [
    { 
      value: "members", 
      label: "Members",
      sheets: [
        {
          id: "members",
          name: "Members",
          columns: [
            { name: "member_id", type: "string", label: "Member ID" },
            { name: "first_name", type: "string", label: "First Name" },
            { name: "last_name", type: "string", label: "Last Name" },
            { name: "phone_number", type: "string", label: "Phone Number" },
            { name: "email", type: "string", label: "Email" },
            { name: "dob", type: "date", label: "Date of Birth" },
            { name: "gender", type: "string", label: "Gender" },
            { name: "address", type: "string", label: "Address" },
            { name: "family_id", type: "string", label: "Family ID" },
            { name: "member_status", type: "string", label: "Member Status" }
          ]
        }
      ]
    },
    { 
      value: "families", 
      label: "Families",
      sheets: [
        {
          id: "families",
          name: "Families",
          columns: [
            { name: "family_id", type: "string", label: "Family ID" },
            { name: "family_name", type: "string", label: "Family Name" }
          ]
        }
      ]
    },
    { 
      value: "groups", 
      label: "Groups",
      sheets: [
        {
          id: "groups",
          name: "Groups",
          columns: [
            { name: "group_id", type: "string", label: "Group ID" },
            { name: "group_name", type: "string", label: "Group Name" },
            { name: "group_type", type: "string", label: "Group Type" }
          ]
        }
      ]
    },
    {
      value: "gatherings",
      label: "Gatherings",
      sheets: [
        {
          id: "gatherings",
          name: "Gatherings",
          columns: [
            { name: "gathering_id", type: "string", label: "Gathering ID" },
            { name: "gathering_name", type: "string", label: "Gathering Name" },
            { name: "gathering_type", type: "string", label: "Gathering Type" },
            { name: "parent_id", type: "string", label: "Parent ID" },
            { name: "gathering_date", type: "date", label: "Date & Time" }
          ]
        }
      ]
    },
    {
      value: "attendance",
      label: "Attendance",
      sheets: [
        {
          id: "attendance",
          name: "Attendance",
          columns: [
            { name: "attendance_id", type: "string", label: "Attendance ID" },
            { name: "member_id", type: "string", label: "Member ID" },
            { name: "gathering_id", type: "string", label: "Gathering ID" }
          ]
        }
      ]
    },
    {
      value: "donations",
      label: "Donations",
      sheets: [
        {
          id: "donations",
          name: "Donations",
          columns: [
            { name: "donation_id", type: "string", label: "Donation ID" },
            { name: "member_id", type: "string", label: "Member ID" },
            { name: "amount", type: "number", label: "Amount" },
            { name: "donation_date", type: "date", label: "Date" },
            { name: "fund", type: "string", label: "Fund" },
            { name: "notes", type: "string", label: "Notes" }
          ]
        }
      ]
    },
    {
      value: "volunteer_roles",
      label: "Volunteer Roles",
      sheets: [
        {
          id: "volunteer_roles",
          name: "Volunteer Roles",
          columns: [
            { name: "role_id", type: "string", label: "Role ID" },
            { name: "role_name", type: "string", label: "Role Name" },
            { name: "description", type: "string", label: "Description" }
          ]
        }
      ]
    },
    {
      value: "volunteer_assignments",
      label: "Volunteer Assignments",
      sheets: [
        {
          id: "volunteer_assignments",
          name: "Assignments",
          columns: [
            { name: "assignment_id", type: "string", label: "Assignment ID" },
            { name: "member_id", type: "string", label: "Member ID" },
            { name: "gathering_id", type: "string", label: "Gathering ID" },
            { name: "role_id", type: "string", label: "Role ID" },
            { name: "assignment_status", type: "string", label: "Status" }
          ]
        }
      ]
    },
    {
      value: "support_requests",
      label: "Support Requests",
      sheets: [
        {
          id: "support_requests",
          name: "Support Requests",
          columns: [
            { name: "request_id", type: "string", label: "Request ID" },
            { name: "member_id", type: "string", label: "Member ID" },
            { name: "requestor_name", type: "string", label: "Requestor Name" },
            { name: "requestor_contact", type: "string", label: "Contact" },
            { name: "request_category", type: "string", label: "Category" },
            { name: "request_details", type: "string", label: "Details" },
            { name: "request_status", type: "string", label: "Status" },
            { name: "assigned_to", type: "string", label: "Assigned To" }
          ]
        }
      ]
    },
    {
      value: "staff",
      label: "Staff",
      sheets: [
        {
          id: "staff",
          name: "Staff",
          columns: [
            { name: "staff_id", type: "string", label: "Staff ID" },
            { name: "member_id", type: "string", label: "Member ID" },
            { name: "job_title", type: "string", label: "Job Title" },
            { name: "appointment_date", type: "date", label: "Appointment Date" }
          ]
        }
      ]
    }
  ];

  const operatorsByType = {
    string: [
      { value: "equals", label: "Equals" },
      { value: "not_equals", label: "Not Equals" },
      { value: "contains", label: "Contains" },
      { value: "starts_with", label: "Starts With" },
      { value: "ends_with", label: "Ends With" },
      { value: "is_empty", label: "Is Empty" },
      { value: "is_not_empty", label: "Is Not Empty" }
    ],
    number: [
      { value: "equals", label: "=" },
      { value: "not_equals", label: "≠" },
      { value: "greater_than", label: ">" },
      { value: "less_than", label: "<" },
      { value: "greater_equals", label: "≥" },
      { value: "less_equals", label: "≤" },
      { value: "between", label: "Between" }
    ],
    date: [
      { value: "equals", label: "On" },
      { value: "not_equals", label: "Not On" },
      { value: "after", label: "After" },
      { value: "before", label: "Before" },
      { value: "between", label: "Between" },
      { value: "last_n_days", label: "Last N Days" },
      { value: "next_n_days", label: "Next N Days" }
    ],
    boolean: [
      { value: "is_true", label: "Is True" },
      { value: "is_false", label: "Is False" }
    ]
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = availableColumns.find(col => col.name === fieldName);
    return field ? operatorsByType[field.type] : [];
  };

  useEffect(() => {
    if (selectedDataSource && selectedSheet) {
      const dataSource = dataSources.find(ds => ds.value === selectedDataSource);
      const sheet = dataSource?.sheets.find(s => s.id === selectedSheet);
      setAvailableColumns(sheet?.columns || []);
      setFilters([]); // Reset filters when sheet changes
    }
  }, [selectedDataSource, selectedSheet]);

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: "",
      operator: "",
      value: ""
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const generateReport = () => {
    // Mock report results based on selected sheet
    let mockResults = [];
    
    if (selectedDataSource === "groups") {
      mockResults = [
        { 
          id: 1, 
          name: "Youth Ministry", 
          type: "Ministry", 
          leader: "John Smith", 
          memberCount: 25, 
          activityCount: 8,
          lastActivity: "2024-08-30",
          avgAttendance: "85%"
        },
        { 
          id: 2, 
          name: "Choir Department", 
          type: "Department", 
          leader: "Mary Johnson", 
          memberCount: 15, 
          activityCount: 12,
          lastActivity: "2024-08-31",
          avgAttendance: "92%"
        },
        { 
          id: 3, 
          name: "Finance Committee", 
          type: "Committee", 
          leader: "Robert Wilson", 
          memberCount: 8, 
          activityCount: 4,
          lastActivity: "2024-08-25",
          avgAttendance: "100%"
        }
      ];
    } else {
      mockResults = [
        { id: 1, name: "John Smith", group: "Youth Fellowship", lastAttendance: "2024-08-15", status: "Active" },
        { id: 2, name: "Mary Johnson", group: "Youth Fellowship", lastAttendance: "2024-08-10", status: "Active" },
        { id: 3, name: "David Wilson", group: "Youth Fellowship", lastAttendance: "2024-08-05", status: "Active" }
      ];
    }
    
    setReportResults(mockResults);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Build custom reports and analyze church data</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports Run</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">47</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exported</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">23</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dataSources.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Groups Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">15</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Custom Report Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Source & Sheet Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="data-source">Primary Data Source</Label>
                <Select value={selectedDataSource} onValueChange={(value) => {
                  setSelectedDataSource(value);
                  setSelectedSheet("");
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDataSource && (
                <div>
                  <Label htmlFor="sheet">Select Sheet</Label>
                  <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a sheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.find(ds => ds.value === selectedDataSource)?.sheets.map((sheet) => (
                        <SelectItem key={sheet.id} value={sheet.id}>
                          <div className="flex items-center gap-2">
                            <TableIcon className="w-4 h-4" />
                            {sheet.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Filters */}
            {selectedSheet && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Label>Filters</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Filter records based on sheet columns
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addFilter} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Filter
                  </Button>
                </div>

                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <Select value={filter.field} onValueChange={(value) => {
                        setFilters(filters.map(f => f.id === filter.id ? {...f, field: value, operator: "", value: ""} : f));
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((column) => (
                            <SelectItem key={column.name} value={column.name}>
                              <div className="flex items-center gap-2">
                                <span>{column.label}</span>
                                <Badge variant="secondary" className="ml-auto">
                                  {column.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {filter.field && (
                        <Select value={filter.operator} onValueChange={(value) => {
                          setFilters(filters.map(f => f.id === filter.id ? {...f, operator: value, value: ""} : f));
                        }}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {getOperatorsForField(filter.field).map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 px-3 py-2 border rounded-md"
                        value={filter.value}
                        onChange={(e) => {
                          setFilters(filters.map(f => f.id === filter.id ? {...f, value: e.target.value} : f));
                        }}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Report */}
            <div className="flex gap-3">
              <Button 
                onClick={generateReport}
                disabled={!selectedDataSource}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Generate Report
              </Button>
              {reportResults.length > 0 && (
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Export to CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Report Results</CardTitle>
                <Badge variant="secondary">
                  {reportResults.length} records found
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedDataSource === "groups" ? (
                        <>
                          <TableHead>Group Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Leader</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Activities</TableHead>
                          <TableHead>Avg Attendance</TableHead>
                          <TableHead>Last Activity</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Name</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>Last Attendance</TableHead>
                          <TableHead>Status</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportResults.map((result) => (
                      <TableRow key={result.id}>
                        {selectedDataSource === "groups" ? (
                          <>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{result.type}</Badge>
                            </TableCell>
                            <TableCell>{result.leader}</TableCell>
                            <TableCell>{result.memberCount}</TableCell>
                            <TableCell>{result.activityCount}</TableCell>
                            <TableCell>{result.avgAttendance}</TableCell>
                            <TableCell>{result.lastActivity}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>{result.group}</TableCell>
                            <TableCell>{result.lastAttendance}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{result.status}</Badge>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;