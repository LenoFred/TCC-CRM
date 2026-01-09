import { useState, useEffect } from "react";
import { Settings, CheckCircle, XCircle, RefreshCw, Key, Copy, Search } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";

const SettingsPage = () => {
  const { toast } = useToast();
  const { isAdmin } = usePermission();
  const [integrations, setIntegrations] = useState({
    googleSheets: { name: "Google Sheets", status: "checking", description: "Main database and member management" },
    googleForms: { name: "Google Forms", status: "checking", description: "Form submissions for members, guests, and volunteers" },
    whatsapp: { name: "WhatsApp Business (Meta)", status: "checking", description: "Bulk messaging via Meta Cloud API" },
    email: { name: "Gmail SMTP", status: "checking", description: "Automated email notifications" },
    sms: { name: "BulkSMS Nigeria", status: "checking", description: "SMS messaging service" },
  });
  const [isChecking, setIsChecking] = useState(true);

  // Password Hashing Tool State
  const [plainPassword, setPlainPassword] = useState("");
  const [hashedPassword, setHashedPassword] = useState("");
  const [isHashing, setIsHashing] = useState(false);

  // Password Reset Tool State
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const loadStaffList = async () => {
    try {
      const response = await api.staff.getAll();
      const staffData = response?.data || response || [];
      setStaffList(staffData);
    } catch (error) {
      console.error('Error loading staff list:', error);
      toast({
        title: "Error",
        description: "Failed to load staff list.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      loadStaffList();
    }
  }, []);

  useEffect(() => {
    if (staffSearch.trim() === "") {
      setFilteredStaff([]);
      setShowStaffDropdown(false);
      return;
    }

    const searchLower = staffSearch.toLowerCase();
    const filtered = staffList.filter(
      (staff) =>
        staff.fullName?.toLowerCase().includes(searchLower) ||
        staff.name?.toLowerCase().includes(searchLower) ||
        staff.email?.toLowerCase().includes(searchLower)
    );
    setFilteredStaff(filtered);
    setShowStaffDropdown(true);
  }, [staffSearch, staffList]);

  const selectStaff = (staff: any) => {
    setSelectedStaff(staff);
    setStaffSearch(staff.fullName || staff.name || "");
    setShowStaffDropdown(false);
  };

  const checkIntegrations = async () => {
    setIsChecking(true);
    
    try {
      const response = await api.settings.getIntegrationStatus();
      if (response.success) {
        setIntegrations(response.integrations);
      } else {
        throw new Error('Failed to fetch integration status');
      }
    } catch (error) {
      console.error('Error checking integrations:', error);
      toast({
        title: "Error",
        description: "Failed to check integration status. Using cached data.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkIntegrations();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === "checking") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      );
    } else if (status === "connected") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      );
    }
  };

  const handleHashPassword = async () => {
    if (!plainPassword) {
      toast({
        title: "Error",
        description: "Please enter a password to hash.",
        variant: "destructive"
      });
      return;
    }

    setIsHashing(true);
    try {
      const response = await api.auth.hashPassword(plainPassword);
      setHashedPassword(response.hashedPassword);
      toast({
        title: "Success",
        description: "Password hashed successfully!",
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      toast({
        title: "Error",
        description: "Failed to hash password.",
        variant: "destructive"
      });
    } finally {
      setIsHashing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Password copied to clipboard.",
    });
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleResetPassword = async () => {
    if (!selectedStaff) {
      toast({
        title: "Error",
        description: "Please select a staff member.",
        variant: "destructive"
      });
      return;
    }

    const passwordToUse = newPassword || generateRandomPassword();
    
    setIsResetting(true);
    try {
      const response = await api.auth.resetPassword(selectedStaff.id, passwordToUse);
      toast({
        title: "Password Reset Successful",
        description: `New password for ${selectedStaff.name}: ${passwordToUse}`,
        duration: 10000, // Show for 10 seconds
      });
      setNewPassword(passwordToUse);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage system integrations and configurations</p>
          </div>
          <Button 
            variant="outline" 
            onClick={checkIntegrations}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="passwords">Passwords</TabsTrigger>
          </TabsList>

          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Integrations Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  External Integrations
                </CardTitle>
                <CardDescription>
                  View the connection status of all integrated services. These integrations are configured via environment variables.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(integrations).map(([key, integration]) => (
                    <div 
                      key={key} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(integration.status)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                  <h4 className="font-medium text-sm mb-2">Configuration Note</h4>
                  <p className="text-xs text-muted-foreground">
                    To connect or disconnect integrations, update the environment variables in your <code className="px-1 py-0.5 bg-background rounded">.env</code> file and restart the backend server. 
                    Contact your system administrator for assistance with integration setup.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passwords Tab */}
          <TabsContent value="passwords" className="space-y-6 mt-6">
            {isAdmin() ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Staff Password Reset
                    </CardTitle>
                    <CardDescription>
                      Reset password for staff members (Admin only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="staffSearch">Search Staff Member</Label>
                        <div className="relative">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                              id="staffSearch"
                              type="text"
                              placeholder="Type staff name or email..."
                              value={staffSearch}
                              onChange={(e) => {
                                setStaffSearch(e.target.value);
                                setSelectedStaff(null); // Clear selection when typing
                              }}
                              onFocus={() => staffSearch && setShowStaffDropdown(true)}
                              className="pl-10"
                            />
                          </div>

                          {/* Dropdown */}
                          {showStaffDropdown && filteredStaff.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredStaff.map((staff) => (
                                <div
                                  key={staff.staffID || staff.id}
                                  className="px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0"
                                  onClick={() => selectStaff(staff)}
                                >
                                  <p className="font-medium text-sm">
                                    {staff.fullName || staff.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {staff.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {staff.staffRole || staff.role} • {staff.status}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {showStaffDropdown && staffSearch && filteredStaff.length === 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4">
                              <p className="text-sm text-muted-foreground text-center">
                                No staff members found
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {selectedStaff && (
                          <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="font-medium">{selectedStaff.fullName || selectedStaff.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedStaff.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {selectedStaff.staffID || selectedStaff.id}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="newPassword">New Password (optional - auto-generate if empty)</Label>
                        <Input
                          id="newPassword"
                          type="text"
                          placeholder="Leave empty to auto-generate"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleResetPassword}
                          disabled={!selectedStaff || isResetting}
                          variant="destructive"
                        >
                          {isResetting ? "Resetting..." : "Reset Password"}
                        </Button>
                        {newPassword && (
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(newPassword)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Password
                          </Button>
                        )}
                      </div>

                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive font-medium">⚠️ Security Warning</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          The new password will be shown only once. Make sure to copy it and share it securely with the staff member.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Password Hashing Tool
                    </CardTitle>
                    <CardDescription>
                      Generate bcrypt hashed passwords for manual database entries (Admin only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="plainPassword">Plain Text Password</Label>
                        <div className="flex gap-2">
                          <Input
                            id="plainPassword"
                            type="text"
                            placeholder="Enter password to hash"
                            value={plainPassword}
                            onChange={(e) => setPlainPassword(e.target.value)}
                          />
                          <Button onClick={handleHashPassword} disabled={isHashing}>
                            {isHashing ? "Hashing..." : "Hash Password"}
                          </Button>
                        </div>
                      </div>

                      {hashedPassword && (
                        <div>
                          <Label htmlFor="hashedPassword">Hashed Password (bcrypt)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="hashedPassword"
                              type="text"
                              value={hashedPassword}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(hashedPassword)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Use this hashed password in the Details sheet for staff authentication.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                    <p className="text-muted-foreground">
                      Password management tools are only available to administrators.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;