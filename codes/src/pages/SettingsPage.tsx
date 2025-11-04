import { useState, useEffect } from "react";
import { Settings, Plus, Database, Users, Bell, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [isAddingField, setIsAddingField] = useState(false);
  const [fieldsError, setFieldsError] = useState(null);

  const fetchCustomFields = async () => {
    setIsLoadingFields(true);
    setFieldsError(null);
    try {
      const data = await api.settings.getCustomFields();
      setCustomFields(data);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      setFieldsError(error.message || 'Failed to load custom fields');
    } finally {
      setIsLoadingFields(false);
    }
  };

  useEffect(() => {
    fetchCustomFields();
  }, []);
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

  const handleFieldAdded = async (newField: any) => {
    setIsAddingField(true);
    try {
      const createdField = await api.settings.createCustomField({
        sheetName: 'members',
        fieldName: newField.name,
        dataType: newField.type
      });
      setCustomFields([...customFields, createdField]);
      toast({
        title: "Custom Field Added",
        description: `${newField.name} has been successfully added`,
      });
    } catch (error) {
      console.error('Error creating custom field:', error);
      toast({
        title: "Failed to Add Custom Field",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive",
      });
    } finally {
      setIsAddingField(false);
    }
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
                    disabled={isLoadingFields}
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
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingFields ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : fieldsError ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Alert variant="destructive" className="max-w-md mx-auto">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Custom Fields Error</AlertTitle>
                              <AlertDescription className="flex items-center justify-between">
                                <span>{fieldsError}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={fetchCustomFields}
                                  disabled={isLoadingFields}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                              </AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      ) : customFields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No custom fields found
                          </TableCell>
                        </TableRow>
                      ) : (
                        customFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {field.required ? (
                                <Badge variant="destructive">Required</Badge>
                              ) : (
                                <Badge variant="secondary">Optional</Badge>
                              )}
                            </TableCell>
                            <TableCell>{field.createdAt}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Custom fields are permanently added to the member sheet and cannot be edited or deleted once created. They will automatically appear on member profiles and forms.</p>
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
                        defaultValue="+234 806 123 4567"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="church-email">Email Address</Label>
                      <Input
                        id="church-email"
                        defaultValue="info@tccchurch.com"
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

      {/* Custom Fields Modal */}
      <CustomFieldsModal
        isOpen={isCustomFieldsModalOpen}
        onClose={() => setIsCustomFieldsModalOpen(false)}
        onFieldAdded={handleFieldAdded}
      />
    </DashboardLayout>
  );
};

export default SettingsPage;