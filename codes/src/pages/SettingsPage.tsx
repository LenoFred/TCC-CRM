import { useState, useEffect } from "react";
import { Settings, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState({
    googleSheets: { name: "Google Sheets", status: "checking", description: "Main database and member management" },
    googleForms: { name: "Google Forms", status: "checking", description: "Form submissions for members, guests, and volunteers" },
    whatsapp: { name: "WhatsApp Business (Meta)", status: "checking", description: "Bulk messaging via Meta Cloud API" },
    email: { name: "Gmail SMTP", status: "checking", description: "Automated email notifications" },
    sms: { name: "BulkSMS Nigeria", status: "checking", description: "SMS messaging service" },
  });
  const [isChecking, setIsChecking] = useState(true);

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
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;