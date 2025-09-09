import { useState } from "react";
import { BarChart, FileDown, Plus, Filter, TrendingUp } from "lucide-react";
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

const AnalyticsPage = () => {
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [filters, setFilters] = useState<Array<{id: number, field: string, operator: string, value: string}>>([]);
  const [reportResults, setReportResults] = useState<any[]>([]);

  const dataSources = [
    { value: "members", label: "Members" },
    { value: "donations", label: "Donations" },
    { value: "attendance", label: "Attendance" },
    { value: "volunteers", label: "Volunteers" },
    { value: "groups", label: "Groups & Departments" }
  ];

  const filterFields = {
    members: ["Status", "Group", "Family", "Join Date", "Last Attendance", "State", "LGA"],
    donations: ["Amount", "Fund", "Date", "Member Status"],
    attendance: ["Event", "Date", "Group", "Status"],
    volunteers: ["Role", "Event", "Status", "Date"],
    groups: ["Type", "Status", "Leader", "Member Count", "Activity Count", "Created Date"]
  };

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "not_in_last", label: "Not in Last N Days" },
    { value: "in_last", label: "In Last N Days" }
  ];

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
    // Mock report results based on data source
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
            {/* Data Source Selection */}
            <div>
              <Label htmlFor="data-source">Primary Data Source</Label>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
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

            {/* Filters */}
            {selectedDataSource && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Filters</Label>
                  <Button variant="outline" size="sm" onClick={addFilter} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Filter
                  </Button>
                </div>

                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex gap-3 items-center p-3 border rounded-lg">
                      <Select value={filter.field} onValueChange={(value) => {
                        setFilters(filters.map(f => f.id === filter.id ? {...f, field: value} : f));
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {filterFields[selectedDataSource as keyof typeof filterFields]?.map((field) => (
                            <SelectItem key={field} value={field.toLowerCase().replace(' ', '_')}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filter.operator} onValueChange={(value) => {
                        setFilters(filters.map(f => f.id === filter.id ? {...f, operator: value} : f));
                      }}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

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