import { useState } from "react";
import { MessageSquare, Mail, Phone, Send, Users, FileDown, Calendar, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScheduledMessagesModal } from "@/components/ScheduledMessagesModal";

const CommunicationsPage = () => {
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [communicationChannel, setCommunicationChannel] = useState<string>("");
  const [isScheduledMessagesModalOpen, setIsScheduledMessagesModalOpen] = useState(false);

  // Mock data - could come from analytics/reports
  const targetGroups = [
    { id: 1, name: "Youth Fellowship Members", count: 25 },
    { id: 2, name: "Sunday Service Regulars", count: 180 },
    { id: 3, name: "New Members (Last 3 Months)", count: 12 },
    { id: 4, name: "Volunteer Team", count: 45 }
  ];

  const recentCommunications = [
    {
      id: 1,
      subject: "Youth Event Reminder",
      recipients: 25,
      channel: "WhatsApp",
      sentAt: "2024-08-30 2:30 PM",
      status: "Delivered"
    },
    {
      id: 2,
      subject: "Weekly Newsletter",
      recipients: 200,
      channel: "Email",
      sentAt: "2024-08-29 10:00 AM",
      status: "Delivered"
    },
    {
      id: 3,
      subject: "Prayer Meeting Announcement",
      recipients: 150,
      channel: "SMS",
      sentAt: "2024-08-28 6:00 PM",
      status: "Delivered"
    }
  ];

  const communicationChannels = [
    { value: "whatsapp", label: "WhatsApp (Primary)", icon: MessageSquare },
    { value: "email", label: "Email", icon: Mail },
    { value: "sms", label: "SMS (Fallback)", icon: Phone }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communications</h1>
            <p className="text-muted-foreground">Send messages and manage member communications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Messages Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,247</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">156</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">98.5%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">312</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList>
            <TabsTrigger value="compose">Compose Message</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="history">Message History</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="export">Export Lists</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recipients Selection */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Recipients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Target Groups</Label>
                    <div className="space-y-3 mt-2">
                      {targetGroups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedRecipients.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRecipients([...selectedRecipients, group.id]);
                              } else {
                                setSelectedRecipients(selectedRecipients.filter(id => id !== group.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                          >
                            {group.name}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {group.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium">
                      Total Recipients: {selectedRecipients.reduce((sum, id) => {
                        const group = targetGroups.find(g => g.id === id);
                        return sum + (group?.count || 0);
                      }, 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Composition */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Compose Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject/Title</Label>
                    <Input
                      id="subject"
                      placeholder="Enter message subject"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message Content</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={8}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {messageContent.length}/500 characters
                    </div>
                  </div>

                  <div>
                    <Label>Communication Channel</Label>
                    <Select value={communicationChannel} onValueChange={setCommunicationChannel}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select communication channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {communicationChannels.map((channel) => (
                          <SelectItem key={channel.value} value={channel.value}>
                            <div className="flex items-center gap-2">
                              <channel.icon className="h-4 w-4" />
                              {channel.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      WhatsApp will be tried first, with SMS as fallback for failed deliveries
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      className="gap-2"
                      disabled={selectedRecipients.length === 0 || !messageContent || !communicationChannel}
                    >
                      <Send className="h-4 w-4" />
                      Send Message
                    </Button>
                    <Button variant="outline">
                      Save Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Scheduled & Automated Messages</h3>
                <p className="text-sm text-muted-foreground">
                  Manage birthday messages, event reminders, and automated communications
                </p>
              </div>
              <Button 
                onClick={() => setIsScheduledMessagesModalOpen(true)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Schedule Message
              </Button>
            </div>

            <div className="grid gap-4">
              {/* Active Scheduled Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Scheduled Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Birthday Greetings</h4>
                        <p className="text-sm text-muted-foreground">Sent daily at 9:00 AM to members on their birthday</p>
                        <Badge variant="secondary" className="mt-1">Automated</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Disable</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Sunday Service Reminder</h4>
                        <p className="text-sm text-muted-foreground">Weekly reminder sent Saturdays at 6:00 PM</p>
                        <Badge variant="outline" className="mt-1">Recurring</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Pause</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Volunteer Reminders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Volunteer Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Automatic Volunteer Reminders</h4>
                      <p className="text-sm text-muted-foreground">
                        Sent 24-48 hours before scheduled volunteer assignments
                      </p>
                      <Badge variant="secondary" className="mt-1">System Automated</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCommunications.map((comm) => (
                    <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{comm.subject}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{comm.recipients} recipients</span>
                          <span>via {comm.channel}</span>
                          <span>{comm.sentAt}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        {comm.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Saved Drafts</h3>
                  <p className="text-sm text-muted-foreground">
                    Messages you've saved for later
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Welcome Message Draft</h4>
                        <p className="text-sm text-muted-foreground">
                          Recipients: New Members • Last modified: 2 days ago
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Send</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Easter Event Reminder</h4>
                        <p className="text-sm text-muted-foreground">
                          Recipients: All Members • Last modified: 1 week ago
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Send</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Export Member Lists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Export filtered member lists to CSV format for use with external tools like Mailchimp.
                </p>
                
                <div className="space-y-3">
                  {targetGroups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.count} members</p>
                      </div>
                      <Button variant="outline" className="gap-2">
                        <FileDown className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Scheduled Messages Modal */}
        <ScheduledMessagesModal
          isOpen={isScheduledMessagesModalOpen}
          onClose={() => setIsScheduledMessagesModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CommunicationsPage;