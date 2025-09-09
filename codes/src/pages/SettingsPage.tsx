import { useState } from "react";
import { Settings, Plus, Database, Users, Bell } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomFieldsModal } from "@/components/CustomFieldsModal";

const SettingsPage = () => {
  const [customFields, setCustomFields] = useState([
    { id: 1, name: "Spiritual Gifts", type: "Text", required: false, createdAt: "2024-01-15" },
    { id: 2, name: "Baptism Date", type: "Date", required: false, createdAt: "2024-02-10" },
    { id: 3, name: "Small Group Leader", type: "Yes/No", required: false, createdAt: "2024-03-05" }
  ]);
  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState(false);

  const [newField, setNewField] = useState({
    name: "",
    type: "",
    required: false
  });

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "date", label: "Date" },
    { value: "yesno", label: "Yes/No" },
    { value: "number", label: "Number" },
    { value: "dropdown", label: "Dropdown" }
  ];

  const addCustomField = () => {
    if (newField.name && newField.type) {
      const field = {
        id: Date.now(),
        name: newField.name,
        type: newField.type,
        required: newField.required,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCustomFields([...customFields, field]);
      setNewField({ name: "", type: "", required: false });
    }
  };

  const removeCustomField = (id: number) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Configure system settings and customizations</p>
          </div>
        </div>

        <Tabs defaultValue="custom-fields" className="space-y-4">
          <TabsList>
            <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="custom-fields" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Custom Member Fields
                  </CardTitle>
                  <Button 
                    onClick={() => setIsCustomFieldsModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Manage Custom Fields
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Data Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{field.name}</TableCell>
                          <TableCell>{field.type}</TableCell>
                          <TableCell>
                            {field.required ? (
                              <Badge variant="destructive">Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </TableCell>
                          <TableCell>{field.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeCustomField(field.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Custom fields will automatically appear on member profiles and forms. Changes may take a few minutes to propagate.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="church-name">Church Name</Label>
                    <Input
                      id="church-name"
                      defaultValue="TCC"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="church-address">Church Address</Label>
                    <Input
                      id="church-address"
                      defaultValue="123 Faith Street, Hope City, HC 12345"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="church-phone">Phone Number</Label>
                      <Input
                        id="church-phone"
                        defaultValue="+1 (555) 123-4567"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="church-email">Email Address</Label>
                      <Input
                        id="church-email"
                        defaultValue="info@unitychurch.com"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Volunteer Reminders</h3>
                      <p className="text-sm text-muted-foreground">
                        Send automatic reminders to volunteers 24-48 hours before events
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">New Member Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        Notify staff when new members register
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Donation Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        Notify admin when donations need verification
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                </div>
                <Button>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>External Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Google Forms</h3>
                      <p className="text-sm text-muted-foreground">
                        Integration for donation form submissions
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">WhatsApp Business</h3>
                      <p className="text-sm text-muted-foreground">
                        For sending bulk messages to members
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">SMS Gateway</h3>
                      <p className="text-sm text-muted-foreground">
                        Fallback messaging service
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;