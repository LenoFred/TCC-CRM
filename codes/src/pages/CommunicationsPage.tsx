import { useState } from "react";
import { MessageSquare, Mail, Phone, Send, Users, FileDown, Calendar, Clock, MapPin, Building, UserCheck, Heart, ChevronDown, ChevronRight } from "lucide-react";
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
import { nigeriaStatesAndLGAs, getLGAsByState } from "@/data/nigeria-states-lga";

const CommunicationsPage = () => {
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [communicationChannel, setCommunicationChannel] = useState<string>("");
  const [isScheduledMessagesModalOpen, setIsScheduledMessagesModalOpen] = useState(false);

  // New state for expanded recipient selection
  const [recipientCategory, setRecipientCategory] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedLGA, setSelectedLGA] = useState<string>("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Mock data - could come from analytics/reports
  const targetGroups = [
    { id: 1, name: "Youth Fellowship Members", count: 25, category: "groups" },
    { id: 2, name: "Sunday Service Regulars", count: 180, category: "groups" },
    { id: 3, name: "New Members (Last 3 Months)", count: 12, category: "members" },
    { id: 4, name: "Volunteer Team", count: 45, category: "volunteers" }
  ];

  // Mock data for expanded categories
  const groups = [
    { id: "grp_1", name: "Youth Ministry", memberCount: 45, type: "Department" },
    { id: "grp_2", name: "Children's Ministry", memberCount: 32, type: "Department" },
    { id: "grp_3", name: "Worship Team", memberCount: 28, type: "Department" },
    { id: "grp_4", name: "Men's Fellowship", memberCount: 67, type: "Fellowship" },
    { id: "grp_5", name: "Women's Fellowship", memberCount: 89, type: "Fellowship" }
  ];

  const families = [
    { id: "fam_1", name: "Smith Family", memberCount: 4 },
    { id: "fam_2", name: "Johnson Family", memberCount: 3 },
    { id: "fam_3", name: "Williams Family", memberCount: 5 },
    { id: "fam_4", name: "Brown Family", memberCount: 2 }
  ];

  const staff = [
    { id: "staff_1", name: "Pastor John", department: "Leadership", role: "Senior Pastor" },
    { id: "staff_2", name: "Mary Johnson", department: "Youth", role: "Youth Leader" },
    { id: "staff_3", name: "David Wilson", department: "Children", role: "Children's Director" },
    { id: "staff_4", name: "Sarah Brown", department: "Administration", role: "Admin Assistant" }
  ];

  const volunteerTeams = [
    { id: "vol_1", name: "Sunday Ushers", memberCount: 12, status: "Active" },
    { id: "vol_2", name: "Sound Technicians", memberCount: 8, status: "Active" },
    { id: "vol_3", name: "Children's Workers", memberCount: 15, status: "Active" },
    { id: "vol_4", name: "Security Team", memberCount: 6, status: "Active" },
    { id: "vol_5", name: "Greeters", memberCount: 10, status: "Inactive" }
  ];

  const recipientCategories = [
    { value: "all_members", label: "All Active Members", icon: Users, count: 312 },
    { value: "groups", label: "Groups/Departments", icon: Building, count: groups.length },
    { value: "families", label: "Families", icon: Heart, count: families.length },
    { value: "staff", label: "Staff Members", icon: UserCheck, count: staff.length },
    { value: "volunteers", label: "Volunteer Teams", icon: UserCheck, count: volunteerTeams.filter(v => v.status === "Active").length },
    { value: "location", label: "Location-based", icon: MapPin, count: nigeriaStatesAndLGAs.length }
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

  // Helper functions for recipient selection
  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups([...selectedGroups, groupId]);
    } else {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    }
  };

  const handleVolunteerSelection = (volunteerId: string, checked: boolean) => {
    if (checked) {
      setSelectedVolunteers([...selectedVolunteers, volunteerId]);
    } else {
      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
    }
  };

  const getSelectedRecipientsCount = () => {
    let count = 0;

    if (recipientCategory === "all_members") {
      count = 312; // Total active members
    } else if (recipientCategory === "groups") {
      count = selectedGroups.reduce((sum, groupId) => {
        const group = groups.find(g => g.id === groupId);
        return sum + (group?.memberCount || 0);
      }, 0);
    } else if (recipientCategory === "families") {
      count = families.length * 3; // Average family size
    } else if (recipientCategory === "staff") {
      count = staff.length;
    } else if (recipientCategory === "volunteers") {
      count = selectedVolunteers.reduce((sum, volId) => {
        const volunteer = volunteerTeams.find(v => v.id === volId);
        return sum + (volunteer?.memberCount || 0);
      }, 0);
    } else if (recipientCategory === "location" && selectedLGA) {
      count = Math.floor(Math.random() * 50) + 10; // Mock count for LGA
    }

    return count;
  };

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
                    <Label>Recipient Category</Label>
                    <Select value={recipientCategory} onValueChange={setRecipientCategory}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose recipient category" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipientCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <category.icon className="h-4 w-4" />
                              {category.label}
                              <Badge variant="outline" className="text-xs ml-auto">
                                {category.count}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Expanded recipient selection based on category */}
                  {recipientCategory === "groups" && (
                    <div className="space-y-3">
                      <Label>Groups/Departments</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {groups.map((group) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={(checked) => handleGroupSelection(group.id, checked as boolean)}
                            />
                            <label
                              htmlFor={`group-${group.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                              {group.name}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {group.memberCount}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipientCategory === "families" && (
                    <div className="space-y-3">
                      <Label>Families</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {families.map((family) => (
                          <div key={family.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`family-${family.id}`}
                              checked={selectedRecipients.includes(parseInt(family.id.split('_')[1]))}
                              onCheckedChange={(checked) => {
                                const familyId = parseInt(family.id.split('_')[1]);
                                if (checked) {
                                  setSelectedRecipients([...selectedRecipients, familyId]);
                                } else {
                                  setSelectedRecipients(selectedRecipients.filter(id => id !== familyId));
                                }
                              }}
                            />
                            <label
                              htmlFor={`family-${family.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                              {family.name}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {family.memberCount} members
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipientCategory === "staff" && (
                    <div className="space-y-3">
                      <Label>Staff Members</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {staff.map((staffMember) => (
                          <div key={staffMember.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`staff-${staffMember.id}`}
                              checked={selectedRecipients.includes(parseInt(staffMember.id.split('_')[1]))}
                              onCheckedChange={(checked) => {
                                const staffId = parseInt(staffMember.id.split('_')[1]);
                                if (checked) {
                                  setSelectedRecipients([...selectedRecipients, staffId]);
                                } else {
                                  setSelectedRecipients(selectedRecipients.filter(id => id !== staffId));
                                }
                              }}
                            />
                            <label
                              htmlFor={`staff-${staffMember.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                              {staffMember.name}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {staffMember.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipientCategory === "volunteers" && (
                    <div className="space-y-3">
                      <Label>Volunteer Teams</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {volunteerTeams.filter(v => v.status === "Active").map((volunteer) => (
                          <div key={volunteer.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`volunteer-${volunteer.id}`}
                              checked={selectedVolunteers.includes(volunteer.id)}
                              onCheckedChange={(checked) => handleVolunteerSelection(volunteer.id, checked as boolean)}
                            />
                            <label
                              htmlFor={`volunteer-${volunteer.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                              {volunteer.name}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {volunteer.memberCount} members
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipientCategory === "location" && (
                    <div className="space-y-3">
                      <Label>Location-based Selection</Label>

                      {/* State Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm">Select State</Label>
                        <Select value={selectedState} onValueChange={(value) => {
                          setSelectedState(value);
                          setSelectedLGA(""); // Reset LGA when state changes
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a state" />
                          </SelectTrigger>
                          <SelectContent>
                            {nigeriaStatesAndLGAs.map((state) => (
                              <SelectItem key={state.name} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* LGA Selection */}
                      {selectedState && (
                        <div className="space-y-2">
                          <Label className="text-sm">Select Local Government Area</Label>
                          <Select value={selectedLGA} onValueChange={setSelectedLGA}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an LGA" />
                            </SelectTrigger>
                            <SelectContent>
                              {getLGAsByState(selectedState).map((lga) => (
                                <SelectItem key={lga} value={lga}>
                                  {lga}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Members in selected LGA */}
                      {selectedLGA && (
                        <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Members in {selectedLGA}, {selectedState}
                            </span>
                            <Badge variant="secondary">
                              {Math.floor(Math.random() * 50) + 10} members
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            All active members in this location will be included
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium">
                      Total Recipients: {getSelectedRecipientsCount()}
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

                {/* Export by Category */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Export by Category</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {recipientCategories.map((category) => (
                        <div key={category.value} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <category.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{category.label}</h4>
                              <p className="text-sm text-muted-foreground">{category.count} items</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export by Groups */}
                  <div>
                    <Label className="text-base font-medium">Export by Groups</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{group.name}</h4>
                            <p className="text-sm text-muted-foreground">{group.memberCount} members • {group.type}</p>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export by Location */}
                  <div>
                    <Label className="text-base font-medium">Export by Location</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">All States & LGAs</h4>
                          <p className="text-sm text-muted-foreground">Complete geographical breakdown</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileDown className="h-4 w-4" />
                          Export All
                        </Button>
                      </div>
                      {selectedState && (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                          <div>
                            <h4 className="font-medium">{selectedState} State</h4>
                            <p className="text-sm text-muted-foreground">{getLGAsByState(selectedState).length} LGAs</p>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Export State
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
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