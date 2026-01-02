import { useState, useEffect } from "react";
import { MessageSquare, Mail, Phone, Send, Users, Calendar, Clock, MapPin, Building, UserCheck, Heart, ChevronDown, ChevronRight, AlertCircle, AlertTriangle, RefreshCw, RefreshCcw, Trash2, CheckCircle, XCircle, Loader2, CalendarRange, TrendingUp, DollarSign, Plus, X } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { nigeriaStatesAndLGAs, getLGAsByState } from "@/data/nigeria-states-lga";
import { useToast } from "@/hooks/use-toast";

// Schedule Message Form Component
const ScheduleMessageForm = ({ 
  schedule, 
  onSave, 
  onCancel,
  recipientSelectionUI 
}: any) => {
  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: schedule?.title || '',
    scheduleType: schedule?.scheduleType || 'sunday service',
    message: schedule?.message || '',
    channel: schedule?.channel || 'whatsapp',
    scheduleDate: schedule?.scheduleDate || '',
    scheduleTime: schedule?.scheduleTime || '',
    frequency: schedule?.frequency || 'once',
    frequencyInterval: schedule?.frequencyInterval || '1', // For custom intervals
    frequencyDay: schedule?.frequencyDay || 'monday', // For weekly schedules
    recipientType: schedule?.recipientType || '',
    recipients: schedule?.recipients || '{}',
    subject: schedule?.subject || '',
    emailProvider: schedule?.emailProvider || 'sendgrid',
    groupIDs: schedule?.groupIDs || '',
    tags: schedule?.tags || '',
    status: schedule?.status || 'pending',
  });

  // Update form when schedule prop changes (for edit mode)
  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title || '',
        scheduleType: schedule.scheduleType || 'sunday service',
        message: schedule.message || '',
        channel: schedule.channel || 'whatsapp',
        scheduleDate: schedule.scheduleDate || '',
        scheduleTime: schedule.scheduleTime || '',
        frequency: schedule.frequency || 'once',
        frequencyInterval: schedule.frequencyInterval || '1',
        frequencyDay: schedule.frequencyDay || 'monday',
        recipientType: schedule.recipientType || '',
        recipients: schedule.recipients || '{}',
        subject: schedule.subject || '',
        emailProvider: schedule.emailProvider || 'sendgrid',
        groupIDs: schedule.groupIDs || '',
        tags: schedule.tags || '',
        status: schedule.status || 'pending',
      });
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.scheduleDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < tomorrow) {
      alert('Please select a date from tomorrow onwards. Messages for today should be sent via Compose Message.');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event/Gathering Name</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="E.g., Youth Gathering, Sunday Service"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduleType">Schedule Type</Label>
        <Select value={formData.scheduleType} onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select schedule type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sunday service">Sunday Service</SelectItem>
            <SelectItem value="program">Program</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Categorize this scheduled message as a Sunday Service or Program event
        </p>
      </div>

      {/* Recipient Selection UI */}
      <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
        <Label className="text-base font-semibold">Select Recipients</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Choose who should receive this message (same as compose message selection)
        </p>
        {recipientSelectionUI}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Enter the message to send..."
          rows={5}
          required
        />
        <p className="text-xs text-muted-foreground">
          This message will be sent to all selected recipients at the scheduled time
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel">Communication Channel</Label>
        <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.channel === 'email' && (
        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Email subject line"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="frequency">Schedule Frequency</Label>
        <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Send Once</SelectItem>
            <SelectItem value="daily">Daily (Every Day)</SelectItem>
            <SelectItem value="every-2-days">Every 2 Days</SelectItem>
            <SelectItem value="every-3-days">Every 3 Days</SelectItem>
            <SelectItem value="weekly">Weekly (Same Day Each Week)</SelectItem>
            <SelectItem value="bi-weekly">Bi-Weekly (Every 2 Weeks)</SelectItem>
            <SelectItem value="monthly">Monthly (Same Date Each Month)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formData.frequency === 'once' 
            ? 'Message will be sent only once at the scheduled time' 
            : `Message will be sent repeatedly ${formData.frequency === 'daily' ? 'every day' : formData.frequency === 'weekly' ? 'every week' : formData.frequency === 'monthly' ? 'every month' : formData.frequency.replace('-', ' ')}`}
        </p>
      </div>

      {formData.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label htmlFor="frequencyDay">Day of the Week</Label>
          <Select value={formData.frequencyDay} onValueChange={(value) => setFormData({ ...formData, frequencyDay: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="tuesday">Tuesday</SelectItem>
              <SelectItem value="wednesday">Wednesday</SelectItem>
              <SelectItem value="thursday">Thursday</SelectItem>
              <SelectItem value="friday">Friday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Message will be sent every {formData.frequencyDay.charAt(0).toUpperCase() + formData.frequencyDay.slice(1)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduleDate">
            {formData.frequency === 'once' ? 'Send Date' : 'Start Date'}
          </Label>
          <Input
            id="scheduleDate"
            type="date"
            value={formData.scheduleDate}
            onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
            min={getTomorrowDate()}
            required
          />
          <p className="text-xs text-muted-foreground">
            Must be tomorrow or later
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduleTime">Send Time</Label>
          <Input
            id="scheduleTime"
            type="time"
            value={formData.scheduleTime}
            onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            {formData.frequency !== 'once' ? 'Time for each occurrence' : 'One-time send'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {schedule ? 'Update Schedule' : 'Schedule Message'}
        </Button>
      </div>
    </form>
  );
};

const CommunicationsPage = () => {
  const { toast } = useToast();
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [communicationChannel, setCommunicationChannel] = useState<string>("");
  const [isScheduledMessagesModalOpen, setIsScheduledMessagesModalOpen] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [recipientsError, setRecipientsError] = useState(null);

  // New state for expanded recipient selection
  const [recipientCategory, setRecipientCategory] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedLGA, setSelectedLGA] = useState<string>("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [selectedLocationMembers, setSelectedLocationMembers] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState([]);
  const [families, setFamilies] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // Manual phone number input
  const [manualPhoneNumbers, setManualPhoneNumbers] = useState<string[]>([]);
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [volunteerTeams, setVolunteerTeams] = useState([]);
  const [guests, setGuests] = useState([]);
  const [locationMembers, setLocationMembers] = useState([]);
  const [isLoadingLocationMembers, setIsLoadingLocationMembers] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({});
  const [volunteerMemberCounts, setVolunteerMemberCounts] = useState<Record<string, number>>({});
  
  // All Members category state
  const [allMembers, setAllMembers] = useState([]);
  const [selectedAllMembers, setSelectedAllMembers] = useState<string[]>([]);
  const [allMembersSearch, setAllMembersSearch] = useState("");
  const [isLoadingAllMembers, setIsLoadingAllMembers] = useState(false);
  
  // Search states
  const [groupSearch, setGroupSearch] = useState("");
  const [familySearch, setFamilySearch] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [volunteerSearch, setVolunteerSearch] = useState("");

  // Communications history state
  const [communicationsHistory, setCommunicationsHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    channel: '',
    status: ''
  });

  // Drafts state
  const [drafts, setDrafts] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);

  // Scheduled messages state
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState("all");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null);

  // Automated messages state
  const [isAutomatedModalOpen, setIsAutomatedModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null);
  const [automatedConfigs, setAutomatedConfigs] = useState<any[]>([
    { id: 1, name: 'Birthday Messages', type: 'birthday', enabled: true, channel: 'whatsapp,email', triggerTime: '09:00' },
    { id: 2, name: 'Volunteer Assignment Notifications', type: 'volunteer', enabled: true, channel: 'whatsapp,sms', triggerTime: 'instant' },
    { id: 3, name: 'New Guest Welcome Messages', type: 'guest_welcome', enabled: true, channel: 'whatsapp,email', triggerTime: 'same_day' },
    { id: 4, name: 'Absent Member Follow-up', type: 'absent_followup', enabled: false, channel: 'phone,sms', triggerTime: '3_weeks' }
  ]);

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);

  // Email provider selection
  const [emailProvider, setEmailProvider] = useState<'sendgrid' | 'gmail'>('sendgrid');

  const fetchRecipients = async () => {
    setIsLoadingRecipients(true);
    setRecipientsError(null);
    try {
      // Fetch groups from Groups sheet
      try {
        const groupsResponse = await api.groups.getAll();
        console.log('Groups response:', groupsResponse);
        const groupsData = groupsResponse?.data || [];
        setGroups(Array.isArray(groupsData) ? groupsData : []);
        
        // Fetch member counts for each group from GroupMembers sheet
        const memberCounts: Record<string, number> = {};
        for (const group of groupsData) {
          const groupId = group.x || group.id || group.groupID;
          try {
            const membersResponse = await api.groupMembers.getByGroup(groupId);
            memberCounts[groupId] = membersResponse?.total || membersResponse?.members?.length || 0;
          } catch (error) {
            console.error(`Error fetching members for group ${groupId}:`, error);
            memberCounts[groupId] = 0;
          }
        }
        setGroupMemberCounts(memberCounts);
        console.log('Group member counts:', memberCounts);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setGroups([]);
      }

      // Fetch staff from Staff sheet
      try {
        const staffResponse = await api.staff.getAll();
        console.log('Staff response:', staffResponse);
        const staffData = Array.isArray(staffResponse) ? staffResponse : ((staffResponse as any)?.data || []);
        console.log('Staff data extracted:', staffData);
        console.log('Staff IDs:', staffData.map((s: any) => ({ id: s.id, type: typeof s.id, name: s.name })));
        setStaff(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      }

      // Fetch families
      try {
        const familiesResponse = await api.families.getAll();
        console.log('Families response:', familiesResponse);
        const familiesData = familiesResponse?.data || [];
        console.log('Families data extracted:', familiesData);
        console.log('Families IDs:', familiesData.map((f: any) => ({ id: f.id, type: typeof f.id, name: f.name })));
        console.log('First family full object:', familiesData[0]);
        setFamilies(Array.isArray(familiesData) ? familiesData : []);
      } catch (error) {
        console.error('Error fetching families:', error);
        setFamilies([]);
      }

      // Fetch guests
      try {
        const guestsResponse = await api.guestManagement.getAllGuests();
        console.log('Guests response:', guestsResponse);
        const guestsData = guestsResponse?.data || [];
        console.log('Guests data extracted:', guestsData);
        console.log('Guests IDs:', guestsData.map((g: any) => ({ id: g.id, type: typeof g.id, name: g.name })));
        console.log('First guest full object:', guestsData[0]);
        setGuests(Array.isArray(guestsData) ? guestsData : []);
      } catch (error) {
        console.error('Error fetching guests:', error);
        setGuests([]);
      }

      // Fetch volunteer roles
      try {
        const volunteerRolesResponse = await api.volunteers.getRoles();
        console.log('Volunteer roles response:', volunteerRolesResponse);
        const volunteerRolesData = Array.isArray(volunteerRolesResponse) ? volunteerRolesResponse : ((volunteerRolesResponse as any)?.data || []);
        console.log('First volunteer full object:', volunteerRolesData[0]);
        setVolunteerTeams(Array.isArray(volunteerRolesData) ? volunteerRolesData : []);
        
        // Fetch member counts for each volunteer role from VolunteerAssignments sheet
        const volCounts: Record<string, number> = {};
        for (const role of volunteerRolesData) {
          const roleId = role.roleID || role.id || role.roleId || role.x;
          try {
            const assignmentsResponse = await api.volunteers.getAssignmentsByRole(roleId);
            volCounts[roleId] = assignmentsResponse?.total || assignmentsResponse?.assignments?.length || 0;
          } catch (error) {
            console.error(`Error fetching assignments for role ${roleId}:`, error);
            volCounts[roleId] = 0;
          }
        }
        setVolunteerMemberCounts(volCounts);
        console.log('Volunteer member counts:', volCounts);
      } catch (error) {
        console.error('Error fetching volunteer roles:', error);
        setVolunteerTeams([]);
      }
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      setRecipientsError(error?.message || 'Failed to load recipients');
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Fetch members by location
  const fetchMembersByLocation = async (state: string, lga: string) => {
    setIsLoadingLocationMembers(true);
    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (lga) params.append('lga', lga);
      
      const response = await api.members.getAll(params);
      setLocationMembers((response as any)?.data || []);
      return (response as any)?.data || [];
    } catch (error: any) {
      console.error('Error fetching members by location:', error);
      setLocationMembers([]);
      return [];
    } finally {
      setIsLoadingLocationMembers(false);
    }
  };

  // Fetch communications history
  const fetchCommunicationsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.communications.getHistory(historyFilters);
      setCommunicationsHistory((response as any)?.data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load communications history",
        variant: "destructive"
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch drafts
  const fetchDrafts = async () => {
    setIsLoadingDrafts(true);
    try {
      const response = await api.communications.getDrafts();
      setDrafts((response as any)?.data || []);
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error",
        description: "Failed to load drafts",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Fetch scheduled messages
  const fetchScheduledMessages = async () => {
    setIsLoadingScheduled(true);
    try {
      const params: any = {};
      
      // If searching, search across all messages (ignore type filter)
      if (scheduleSearch) {
        params.search = scheduleSearch;
        // Don't apply scheduleType filter when searching - search everything
      } else {
        // Apply type filter only when NOT searching
        if (scheduleTypeFilter && scheduleTypeFilter !== 'all') {
          params.scheduleType = scheduleTypeFilter;
        }
      }
      
      console.log('Fetching scheduled messages with params:', params);
      const response = await api.communications.getScheduled(params);
      console.log('Scheduled messages response:', response);
      
      const data = (response as any)?.data;
      if (Array.isArray(data)) {
        setScheduledMessages(data);
        console.log('Set scheduled messages:', data.length, 'items');
      } else {
        console.warn('Scheduled messages data is not an array:', data);
        setScheduledMessages([]);
      }
    } catch (error: any) {
      console.error('Error fetching scheduled messages:', error);
      setScheduledMessages([]); // Ensure it's always an array
      toast({
        title: "Error",
        description: "Failed to load scheduled messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  // Handle schedule edit
  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    
    // Pre-populate recipient selections based on saved data
    try {
      const recipientData = typeof schedule.recipients === 'string' 
        ? JSON.parse(schedule.recipients) 
        : schedule.recipients || {};
      
      // Set recipient category
      if (schedule.recipientType) {
        setRecipientCategory(schedule.recipientType);
      }
      
      // Restore ALL selections from all recipient types
      if (recipientData.memberIds) {
        setSelectedAllMembers(recipientData.memberIds);
      }
      if (recipientData.groupIds) {
        setSelectedGroups(recipientData.groupIds);
      }
      if (recipientData.volunteerTeamIds) {
        setSelectedVolunteers(recipientData.volunteerTeamIds);
      }
      
      // Combine families, guests, and staff IDs into selectedRecipients
      const allRecipientIds = [
        ...(recipientData.familyIds || []),
        ...(recipientData.guestIds || []),
        ...(recipientData.staffIds || [])
      ];
      if (allRecipientIds.length > 0) {
        setSelectedRecipients(allRecipientIds);
      }
      
      if (recipientData.manualPhoneNumbers) {
        setManualPhoneNumbers(recipientData.manualPhoneNumbers);
      }
      
      // For location-based, parse tags to get state/LGA
      if (schedule.recipientType === 'location' && schedule.tags) {
        const locationParts = schedule.tags.split(',').map((s: string) => s.trim());
        if (locationParts.length >= 2) {
          setSelectedState(locationParts[0]);
          setSelectedLGA(locationParts[1]);
        }
        if (recipientData.memberIds) {
          setSelectedLocationMembers(recipientData.memberIds);
        }
      }
    } catch (error) {
      console.error('Error parsing recipients:', error);
    }
    
    setIsScheduleModalOpen(true);
  };

  // Handle schedule cancel - show confirmation dialog
  const handleCancelSchedule = (schedule: any) => {
    setScheduleToDelete(schedule);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    
    try {
      await api.communications.cancelScheduled(scheduleToDelete.scheduleID);
      toast({
        title: "Success",
        description: "Scheduled message cancelled successfully",
      });
      fetchScheduledMessages();
    } catch (error: any) {
      console.error('Error cancelling schedule:', error);
      toast({
        title: "Error",
        description: "Failed to cancel scheduled message",
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setScheduleToDelete(null);
    }
  };

  // Handle schedule save (create or update)
  const handleSaveSchedule = async (scheduleData: any) => {
    try {
      // Collect ALL selected recipients from ALL categories (not mutually exclusive)
      const recipientData: any = {};
      const recipientTypes: string[] = [];
      
      // Collect all members if selected
      if (selectedAllMembers.length > 0) {
        recipientData.memberIds = selectedAllMembers;
        recipientTypes.push('all_members');
      }
      
      // Collect all groups if selected
      if (selectedGroups.length > 0) {
        recipientData.groupIds = selectedGroups;
        recipientTypes.push('groups');
        scheduleData.groupIDs = selectedGroups.join(',');
      }
      
      // Collect all volunteers if selected
      if (selectedVolunteers.length > 0) {
        recipientData.volunteerTeamIds = selectedVolunteers;
        recipientTypes.push('volunteers');
      }
      
      // Collect location-based members if selected
      if (selectedLocationMembers.length > 0) {
        if (!recipientData.memberIds) recipientData.memberIds = [];
        recipientData.memberIds = [...recipientData.memberIds, ...selectedLocationMembers];
        recipientTypes.push('location');
        scheduleData.tags = `${selectedState}, ${selectedLGA}`;
      }
      
      // Collect families, guests, and staff from selectedRecipients - separate them by type
      if (selectedRecipients.length > 0) {
        const familyIds = selectedRecipients.filter((id: string) => 
          families.some((f: any) => String(f.familyID || f.id || f.x) === id)
        );
        const guestIds = selectedRecipients.filter((id: string) => 
          guests.some((g: any) => String(g.guestID || g.id || g.x) === id)
        );
        const staffIds = selectedRecipients.filter((id: string) => 
          staff.some((s: any) => String(s.id || s.staffID || s.x) === id)
        );
        
        if (familyIds.length > 0) {
          recipientData.familyIds = familyIds;
          recipientTypes.push('families');
        }
        if (guestIds.length > 0) {
          recipientData.guestIds = guestIds;
          recipientTypes.push('guests');
        }
        if (staffIds.length > 0) {
          recipientData.staffIds = staffIds;
          recipientTypes.push('staff');
        }
      }
      
      // Collect manual phone numbers if provided
      if (manualPhoneNumbers.length > 0) {
        recipientData.manualPhoneNumbers = manualPhoneNumbers;
        recipientTypes.push('manual');
      }
      
      // Set recipientType as comma-separated list or 'mixed' if multiple types
      scheduleData.recipientType = recipientTypes.length > 1 ? 'mixed' : recipientTypes[0] || '';
      
      // Store recipients as JSON string
      scheduleData.recipients = JSON.stringify(recipientData);
      
      if (editingSchedule) {
        await api.communications.updateScheduled(editingSchedule.scheduleID, scheduleData);
        toast({
          title: "Success",
          description: "Scheduled message updated successfully",
        });
      } else {
        await api.communications.createScheduled(scheduleData);
        toast({
          title: "Success",
          description: "Scheduled message created successfully",
        });
      }
      
      // Clear selections after saving
      setSelectedAllMembers([]);
      setSelectedGroups([]);
      setSelectedVolunteers([]);
      setSelectedLocationMembers([]);
      setSelectedRecipients([]);
      setManualPhoneNumbers([]);
      setRecipientCategory('');
      
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      fetchScheduledMessages();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingSchedule ? 'update' : 'create'} scheduled message`,
        variant: "destructive"
      });
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await api.communications.getAnalytics(
        historyFilters.startDate,
        historyFilters.endDate
      );
      setAnalytics(response);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await api.communications.getStats();
      setStats(response);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch total members count
  const fetchMembersCount = async () => {
    try {
      const response = await api.members.getAll();
      setTotalMembers((response as any)?.total || 0);
    } catch (error: any) {
      console.error('Error fetching members count:', error);
    }
  };

  // Handle draft send
  const handleSendDraft = async (draftId: string) => {
    setSendingDraftId(draftId);
    try {
      const draft = drafts.find((d: any) => d.id === draftId);
      if (!draft) return;

      await api.communications.send({
        ...draft,
        emailProvider: emailProvider
      });

      toast({
        title: "Success",
        description: "Draft sent successfully",
      });

      // Delete draft and refresh
      await api.communications.deleteDraft(draftId);
      fetchDrafts();
      fetchCommunicationsHistory();
    } catch (error: any) {
      console.error('Error sending draft:', error);
      toast({
        title: "Error",
        description: "Failed to send draft",
        variant: "destructive"
      });
    } finally {
      setSendingDraftId(null);
    }
  };

  // Handle draft delete
  const handleDeleteDraft = async (draftId: string) => {
    try {
      await api.communications.deleteDraft(draftId);
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
      fetchDrafts();
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsInitializing(true);
        await Promise.all([
          fetchRecipients(),
          fetchCommunicationsHistory(),
          fetchDrafts(),
          fetchScheduledMessages().catch(err => {
            console.error('Failed to fetch scheduled messages:', err);
            setScheduledMessages([]);
            setIsLoadingScheduled(false);
          }),
          fetchStats(),
          fetchMembersCount()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeData();
  }, []);

  // Refresh history when filters change
  useEffect(() => {
    if (historyFilters.startDate || historyFilters.endDate || historyFilters.channel || historyFilters.status) {
      fetchCommunicationsHistory();
      fetchAnalytics();
    }
  }, [historyFilters]);

  // Refresh scheduled messages when search or filter changes
  useEffect(() => {
    // Skip on initial mount - only refetch when search/filter actively changes
    if (scheduleSearch || scheduleTypeFilter !== 'all') {
      const timer = setTimeout(() => {
        fetchScheduledMessages();
      }, 300); // Debounce search
      
      return () => clearTimeout(timer);
    }
  }, [scheduleSearch, scheduleTypeFilter]);

  const recipientCategories = [
    { value: "all_members", label: "All Active Members", icon: Users, count: isLoadingRecipients ? '...' : totalMembers },
    { value: "groups", label: "Groups/Departments", icon: Building, count: isLoadingRecipients ? '...' : groups.length },
    { value: "families", label: "Families", icon: Heart, count: isLoadingRecipients ? '...' : families.length },
    { value: "guests", label: "Guests", icon: Users, count: isLoadingRecipients ? '...' : guests.length },
    { value: "staff", label: "Staff Members", icon: UserCheck, count: isLoadingRecipients ? '...' : staff.length },
    { value: "volunteers", label: "Volunteer Roles", icon: UserCheck, count: isLoadingRecipients ? '...' : volunteerTeams.length },
    { value: "location", label: "Location-based", icon: MapPin, count: nigeriaStatesAndLGAs.length }
  ];

  const communicationChannels = [
    { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { value: "email", label: "Email", icon: Mail },
    { value: "sms", label: "SMS", icon: Phone }
  ];

  const emailProviders = [
    { value: "sendgrid", label: "SendGrid (Promotional)" },
    { value: "gmail", label: "Gmail (Automated)" }
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

  // Fetch all members for "All Active Members" category
  const fetchAllMembers = async () => {
    setIsLoadingAllMembers(true);
    try {
      const response = await api.members.getAll(new URLSearchParams());
      setAllMembers((response as any)?.data || []);
    } catch (error: any) {
      console.error('Error fetching all members:', error);
      setAllMembers([]);
    } finally {
      setIsLoadingAllMembers(false);
    }
  };

  // Handle recipient category change
  const handleRecipientCategoryChange = (category: string) => {
    console.log('Changing recipient category to:', category);
    console.log('Keeping selections - current:', { selectedRecipients, selectedGroups, selectedVolunteers });
    setRecipientCategory(category);
    
    // Fetch all members if "all_members" category is selected
    if (category === 'all_members' && allMembers.length === 0) {
      fetchAllMembers();
    }
    
    // DON'T clear selections - keep accumulating across categories
    // Only clear location-based selections
    setSelectedState("");
    setSelectedLGA("");
    console.log('Category changed, selections preserved:', category);
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

    // Count from ALL selected categories (accumulate across categories)
    
    // Count selected all members
    if (selectedAllMembers.length > 0) {
      count += selectedAllMembers.length;
    }
    
    // Count selected groups
    if (selectedGroups.length > 0) {
      const groupsCount = selectedGroups.reduce((sum, groupId) => {
        const memberCount = groupMemberCounts[groupId] || 0;
        console.log(`Group ${groupId} has ${memberCount} members`);
        return sum + memberCount;
      }, 0);
      count += groupsCount;
    }

    // Count selected volunteers
    if (selectedVolunteers.length > 0) {
      const volunteersCount = selectedVolunteers.reduce((sum, volId) => {
        const memberCount = volunteerMemberCounts[volId] || 0;
        console.log(`Volunteer role ${volId} has ${memberCount} members`);
        return sum + memberCount;
      }, 0);
      count += volunteersCount;
    }

    // Count selected families, guests, and staff from selectedRecipients
    // We need to determine which category each ID belongs to
    if (selectedRecipients.length > 0) {
      selectedRecipients.forEach(recipientId => {
        // Check if it's a family
        const family = families.find((f: any) => String(f.familyID || f.id || f.familyId || f.x) === recipientId);
        if (family) {
          count += family?.memberCount || 1;
          return;
        }

        // Check if it's a guest
        const guest = guests.find((g: any) => String(g.guestID || g.id || g.guestId || g.x) === recipientId);
        if (guest) {
          count += 1; // Guests count as 1 each
          return;
        }

        // Check if it's a staff member
        const staffMember = staff.find((s: any) => String(s.id || s.staffID || s.memberID || s.x) === recipientId);
        if (staffMember) {
          count += 1; // Staff count as 1 each
          return;
        }
      });
    }

    // Count location-based selections (only selected members)
    // Count regardless of current selectedLGA - selections persist across category changes
    if (selectedLocationMembers.length > 0) {
      count += selectedLocationMembers.length;
    }

    // Count manual phone numbers
    count += manualPhoneNumbers.length;

    return count;
  };

  // Add loading state for initial render
  const [isInitializing, setIsInitializing] = useState(true);

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
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {stats?.totalCommunications?.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {stats?.deliveredCommunications?.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {stats?.successRate || 0}%
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {totalMembers?.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList>
            <TabsTrigger value="compose">Compose Message</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="history">Message History</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                  {recipientsError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Recipients Error</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{recipientsError}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchRecipients}
                          disabled={isLoadingRecipients}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div>
                      <Label>Recipient Category</Label>
                      <Select value={recipientCategory} onValueChange={handleRecipientCategoryChange} disabled={isLoadingRecipients}>
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
                  )}

                  {/* Expanded recipient selection based on category */}
                  {recipientCategory === "all_members" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Select Active Members</span>
                        <Badge variant="secondary">{allMembers.length} total members</Badge>
                      </div>

                      {isLoadingAllMembers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                        </div>
                      ) : (
                        <>
                          {/* Search and Select All */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search members..."
                              value={allMembersSearch}
                              onChange={(e) => setAllMembersSearch(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allIds = allMembers.map((m: any) => String(m.memberID || m.id || m.x));
                                if (selectedAllMembers.length === allIds.length) {
                                  setSelectedAllMembers([]);
                                } else {
                                  setSelectedAllMembers(allIds);
                                }
                              }}
                            >
                              {selectedAllMembers.length === allMembers.length ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>

                          {/* Member List */}
                          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                            {allMembers
                              .filter((member: any) => {
                                if (!allMembersSearch) return true;
                                const searchLower = allMembersSearch.toLowerCase();
                                const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
                                const email = (member.email || '').toLowerCase();
                                const phone = (member.phoneNumber || member.phone || '').toLowerCase();
                                return fullName.includes(searchLower) || 
                                       email.includes(searchLower) || 
                                       phone.includes(searchLower);
                              })
                              .map((member: any) => {
                                const memberId = String(member.memberID || member.id || member.x);
                                const isSelected = selectedAllMembers.includes(memberId);
                                
                                return (
                                  <div
                                    key={memberId}
                                    className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedAllMembers(selectedAllMembers.filter(id => id !== memberId));
                                      } else {
                                        setSelectedAllMembers([...selectedAllMembers, memberId]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedAllMembers([...selectedAllMembers, memberId]);
                                        } else {
                                          setSelectedAllMembers(selectedAllMembers.filter(id => id !== memberId));
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium">
                                        {member.firstName} {member.lastName}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {member.email || member.phoneNumber || member.phone || 'No contact info'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            {selectedAllMembers.length} of {allMembers.length} members selected
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {recipientCategory === "groups" && (() => {
                    console.log('Rendering groups category:', { selectedGroups, totalGroups: groups.length });
                    return true;
                  })() && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Groups/Departments</Label>
                        {groups.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Groups Select All clicked:', { currentSelected: selectedGroups.length, totalGroups: groups.length });
                              if (selectedGroups.length === groups.length) {
                                console.log('Deselecting all groups');
                                setSelectedGroups([]);
                              } else {
                                const allGroupIds = groups.map((g: any) => {
                                  const gid = String(g.x || g.id || g.groupID);
                                  console.log('Mapping group:', { group: g, extractedId: gid });
                                  return gid;
                                });
                                console.log('Selecting all groups:', allGroupIds);
                                setSelectedGroups(allGroupIds);
                              }
                            }}
                          >
                            {selectedGroups.length === groups.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        )}
                      </div>
                      {groups.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No groups available
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder="Search groups..."
                            value={groupSearch}
                            onChange={(e) => setGroupSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(() => {
                              const searchTerm = (groupSearch || '').trim().toLowerCase();
                              return (Array.isArray(groups) ? groups : [])
                                .filter((group: any) => {
                                  if (!searchTerm) return true;
                                  const name = (group?.name || group?.groupName || '').toLowerCase();
                                  const description = (group?.description || '').toLowerCase();
                                  return name.includes(searchTerm) || description.includes(searchTerm);
                                });
                            })().map((group: any) => {
                              const groupId = group.x || group.id || group.groupID;
                              return (
                                <div key={groupId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`group-${groupId}`}
                                    checked={selectedGroups.includes(String(groupId)) === true}
                                    onCheckedChange={(checked) => {
                                      console.log('Group checkbox clicked:', { groupId, groupIdString: String(groupId), checked, selectedGroups });
                                      handleGroupSelection(String(groupId), checked as boolean);
                                    }}
                                  />
                                  <label
                                    htmlFor={`group-${groupId}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                  >
                                    {group.name || group.groupName || 'Unnamed Group'}
                                    {group.description && (
                                      <span className="text-xs text-muted-foreground ml-1">({group.description})</span>
                                    )}
                                  </label>
                                  <Badge variant="outline" className="text-xs">
                                    {groupMemberCounts[groupId] || 0}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {recipientCategory === "families" && (() => {
                    console.log('Rendering families category:', { selectedRecipients, totalFamilies: families.length });
                    return true;
                  })() && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Families</Label>
                        {families.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedRecipients.length === families.length) {
                                setSelectedRecipients([]);
                              } else {
                                setSelectedRecipients(families.map((f: any) => String(f.familyID || f.id || f.familyId || f.x)));
                              }
                            }}
                          >
                            {selectedRecipients.length === families.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        )}
                      </div>
                      {families.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No families available
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder="Search families..."
                            value={familySearch}
                            onChange={(e) => setFamilySearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(() => {
                              const searchTerm = (familySearch || '').trim().toLowerCase();
                              const filtered = (Array.isArray(families) ? families : [])
                                .filter((family: any) => {
                                  if (!searchTerm) return true;
                                  const familyName = (family?.name || family?.familyName || '').toLowerCase();
                                  return familyName.includes(searchTerm);
                                });
                              console.log('Filtered families:', { searchTerm, totalFamilies: families.length, filteredCount: filtered.length, filtered });
                              return filtered;
                            })().map((family: any) => {
                              console.log('Family full object:', family);
                              const familyId = family.familyID || family.id || family.familyId || family.x || family.rowNumber;
                              console.log('Family item:', { family, extractedId: familyId, allKeys: Object.keys(family) });
                              return (
                                <div key={familyId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`family-${familyId}`}
                                    checked={selectedRecipients.includes(String(familyId))}
                                    onCheckedChange={(checked) => {
                                      console.log('Family checkbox changed:', { familyId, checked, currentSelected: selectedRecipients });
                                      if (checked) {
                                        const newSelected = [...selectedRecipients, String(familyId)];
                                        console.log('New selected after add:', newSelected);
                                        setSelectedRecipients(newSelected);
                                      } else {
                                        const newSelected = selectedRecipients.filter(id => id !== String(familyId));
                                        console.log('New selected after remove:', newSelected);
                                        setSelectedRecipients(newSelected);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`family-${familyId}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                  >
                                    {family.name || family.familyName || 'Unnamed Family'}
                                  </label>
                                  <Badge variant="outline" className="text-xs">
                                    {family.memberCount || 0} members
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {recipientCategory === "guests" && (() => {
                    console.log('Rendering guests category:', { selectedRecipients, totalGuests: guests.length });
                    return true;
                  })() && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Guests</Label>
                        {guests.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedRecipients.length === guests.length) {
                                setSelectedRecipients([]);
                              } else {
                                setSelectedRecipients(guests.map((g: any) => String(g.guestID || g.id || g.guestId || g.x)));
                              }
                            }}
                          >
                            {selectedRecipients.length === guests.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        )}
                      </div>
                      {guests.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No guests available
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder="Search guests..."
                            value={guestSearch}
                            onChange={(e) => setGuestSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(() => {
                              const searchTerm = (guestSearch || '').trim().toLowerCase();
                              const filtered = (Array.isArray(guests) ? guests : [])
                                .filter((guest: any) => {
                                  if (!searchTerm) return true;
                                  const name = (guest?.name || '').toLowerCase();
                                  const email = (guest?.email || '').toLowerCase();
                                  const phone = (guest?.phone || '').toLowerCase();
                                  return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
                                });
                              console.log('Filtered guests:', { searchTerm, totalGuests: guests.length, filteredCount: filtered.length });
                              return filtered;
                            })().map((guest: any) => {
                              console.log('Guest full object:', guest);
                              const guestId = guest.guestID || guest.id || guest.guestId || guest.x || guest.rowNumber;
                              console.log('Guest item:', { guest, extractedId: guestId, allKeys: Object.keys(guest) });
                              return (
                                <div key={guestId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`guest-${guestId}`}
                                    checked={selectedRecipients.includes(String(guestId))}
                                    onCheckedChange={(checked) => {
                                      console.log('Guest checkbox changed:', { guestId, guestIdType: typeof guestId, checked, currentSelected: selectedRecipients });
                                      if (checked) {
                                        const newSelected = [...selectedRecipients, String(guestId)];
                                        console.log('New selected after add:', newSelected);
                                        setSelectedRecipients(newSelected);
                                      } else {
                                        const newSelected = selectedRecipients.filter(id => id !== String(guestId));
                                        console.log('New selected after remove:', newSelected);
                                        setSelectedRecipients(newSelected);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`guest-${guestId}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                  >
                                    {guest.name || 'Unnamed Guest'}
                                    {guest.email && (
                                      <span className="text-xs text-muted-foreground ml-1">({guest.email})</span>
                                    )}
                                  </label>
                                  <Badge variant="outline" className="text-xs">
                                    Guest
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {recipientCategory === "staff" && (() => {
                    console.log('Rendering staff category:', { selectedRecipients, totalStaff: staff.length });
                    return true;
                  })() && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Staff Members</Label>
                        {staff.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedRecipients.length === staff.length) {
                                setSelectedRecipients([]);
                              } else {
                                setSelectedRecipients(staff.map((s: any) => String(s.id || s.staffID || s.memberID || s.x)));
                              }
                            }}
                          >
                            {selectedRecipients.length === staff.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        )}
                      </div>
                      {staff.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No staff members available
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder="Search staff..."
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(() => {
                              const searchTerm = (staffSearch || '').trim().toLowerCase();
                              const filtered = (Array.isArray(staff) ? staff : [])
                                .filter((staffMember: any) => {
                                  if (!searchTerm) return true;
                                  const name = (staffMember?.name || '').toLowerCase();
                                  const email = (staffMember?.email || '').toLowerCase();
                                  const role = (staffMember?.role || '').toLowerCase();
                                  return name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
                                });
                              console.log('Filtered staff:', { searchTerm, totalStaff: staff.length, filteredCount: filtered.length });
                              return filtered;
                            })().map((staffMember: any) => {
                              const staffId = staffMember.id || staffMember.staffID || staffMember.memberID || staffMember.x;
                              console.log('Staff item:', { staffMember, extractedId: staffId });
                              return (
                                <div key={staffId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`staff-${staffId}`}
                                    checked={selectedRecipients.includes(String(staffId))}
                                    onCheckedChange={(checked) => {
                                      console.log('Staff checkbox changed:', { staffId, staffIdType: typeof staffId, checked, currentSelected: selectedRecipients });
                                      if (checked) {
                                        const newSelected = [...selectedRecipients, String(staffId)];
                                        console.log('New selected after add:', newSelected);
                                        setSelectedRecipients(newSelected);
                                      } else {
                                        const newSelected = selectedRecipients.filter(id => id !== String(staffId));
                                        console.log('New selected after remove:', newSelected);
                                        setSelectedRecipients(newSelected);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`staff-${staffId}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                  >
                                    {staffMember.name || 'Unnamed Staff'}
                                    {staffMember.email && (
                                      <span className="text-xs text-muted-foreground ml-1">({staffMember.email})</span>
                                    )}
                                  </label>
                                  <Badge variant="outline" className="text-xs">
                                    {staffMember.role || 'Staff'}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {recipientCategory === "volunteers" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Volunteer Roles</Label>
                        {volunteerTeams.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Volunteers Select All clicked:', { currentSelected: selectedVolunteers.length, totalVolunteers: volunteerTeams.length });
                              if (selectedVolunteers.length === volunteerTeams.length) {
                                console.log('Deselecting all volunteers');
                                setSelectedVolunteers([]);
                              } else {
                                const allVolunteerIds = volunteerTeams.map((v: any) => {
                                  const vid = String(v.roleID || v.id || v.roleId || v.x);
                                  console.log('Mapping volunteer:', { volunteer: v, extractedId: vid });
                                  return vid;
                                });
                                console.log('Selecting all volunteers:', allVolunteerIds);
                                setSelectedVolunteers(allVolunteerIds);
                              }
                            }}
                          >
                            {selectedVolunteers.length === volunteerTeams.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        )}
                      </div>
                      {volunteerTeams.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No volunteer roles available
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder="Search volunteer roles..."
                            value={volunteerSearch}
                            onChange={(e) => setVolunteerSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(() => {
                              const searchTerm = (volunteerSearch || '').trim().toLowerCase();
                              return (Array.isArray(volunteerTeams) ? volunteerTeams : [])
                                .filter((volunteer: any) => {
                                  if (!searchTerm) return true;
                                  const roleName = (volunteer?.roleName || volunteer?.name || '').toLowerCase();
                                  const description = (volunteer?.description || '').toLowerCase();
                                  return roleName.includes(searchTerm) || description.includes(searchTerm);
                                });
                            })().map((volunteer: any) => {
                              console.log('Volunteer full object:', volunteer);
                              const volunteerId = volunteer.roleID || volunteer.id || volunteer.roleId || volunteer.x || volunteer.rowNumber;
                              console.log('Volunteer item:', { volunteer, extractedId: volunteerId, allKeys: Object.keys(volunteer) });
                              return (
                                <div key={volunteerId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`volunteer-${volunteerId}`}
                                    checked={selectedVolunteers.includes(String(volunteerId)) === true}
                                    onCheckedChange={(checked) => {
                                      console.log('Volunteer checkbox clicked:', { volunteerId, checked, selectedVolunteers });
                                      handleVolunteerSelection(String(volunteerId), checked as boolean);
                                    }}
                                  />
                                  <label
                                    htmlFor={`volunteer-${volunteerId}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                  >
                                    {volunteer.roleName || volunteer.name || 'Unnamed Role'}
                                    {volunteer.description && (
                                      <span className="text-xs text-muted-foreground ml-1">({volunteer.description})</span>
                                    )}
                                  </label>
                                  <Badge variant="outline" className="text-xs">
                                    {volunteerMemberCounts[volunteerId] || 0}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
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
                          <Select 
                            value={selectedLGA} 
                            onValueChange={async (lga) => {
                              setSelectedLGA(lga);
                              if (lga) {
                                await fetchMembersByLocation(selectedState, lga);
                              }
                            }}
                          >
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
                        <div className="mt-4 p-3 bg-muted/20 rounded-lg space-y-3">
                          {isLoadingLocationMembers ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Members in {selectedLGA}, {selectedState}
                                </span>
                                <Badge variant="secondary">
                                  {locationMembers.length} {locationMembers.length === 1 ? 'member' : 'members'}
                                </Badge>
                              </div>

                              {locationMembers.length > 0 && (
                                <>
                                  {/* Search and Select All */}
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Search members..."
                                      value={locationSearchTerm}
                                      onChange={(e) => setLocationSearchTerm(e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const allMemberIds = locationMembers.map((m: any) => String(m.memberID || m.id || m.x));
                                        if (selectedLocationMembers.length === allMemberIds.length) {
                                          setSelectedLocationMembers([]);
                                        } else {
                                          setSelectedLocationMembers(allMemberIds);
                                        }
                                      }}
                                    >
                                      {selectedLocationMembers.length === locationMembers.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </div>

                                  {/* Member List with Checkboxes */}
                                  <div className="max-h-64 overflow-y-auto space-y-2">
                                    {locationMembers
                                      .filter((member: any) => {
                                        if (!locationSearchTerm) return true;
                                        const searchLower = locationSearchTerm.toLowerCase();
                                        const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
                                        const email = (member.email || '').toLowerCase();
                                        const phone = (member.phoneNumber || member.phone || '').toLowerCase();
                                        return fullName.includes(searchLower) || 
                                               email.includes(searchLower) || 
                                               phone.includes(searchLower);
                                      })
                                      .map((member: any) => {
                                        const memberId = String(member.memberID || member.id || member.x);
                                        const isSelected = selectedLocationMembers.includes(memberId);
                                        
                                        return (
                                          <div
                                            key={memberId}
                                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                            onClick={() => {
                                              if (isSelected) {
                                                setSelectedLocationMembers(selectedLocationMembers.filter(id => id !== memberId));
                                              } else {
                                                setSelectedLocationMembers([...selectedLocationMembers, memberId]);
                                              }
                                            }}
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedLocationMembers([...selectedLocationMembers, memberId]);
                                                } else {
                                                  setSelectedLocationMembers(selectedLocationMembers.filter(id => id !== memberId));
                                                }
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-medium">
                                                {member.firstName} {member.lastName}
                                              </div>
                                              <div className="text-xs text-muted-foreground truncate">
                                                {member.email || member.phoneNumber || member.phone || 'No contact info'}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>

                                  <div className="text-xs text-muted-foreground pt-2 border-t">
                                    {selectedLocationMembers.length} of {locationMembers.length} members selected
                                  </div>
                                </>
                              )}

                              {locationMembers.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  No active members found in this location
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total Recipients:</span>
                      <Badge variant="default" className="text-base px-3 py-1">
                        {getSelectedRecipientsCount().toLocaleString()}
                      </Badge>
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

                  {/* Manual Phone Number Input */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <Label htmlFor="manual-phone">Add Custom Phone Numbers</Label>
                    <div className="flex gap-2">
                      <Input
                        id="manual-phone"
                        placeholder="Enter phone number (e.g., +2348012345678)"
                        value={phoneNumberInput}
                        onChange={(e) => setPhoneNumberInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const trimmedNumber = phoneNumberInput.trim();
                          if (trimmedNumber && !manualPhoneNumbers.includes(trimmedNumber)) {
                            setManualPhoneNumbers([...manualPhoneNumbers, trimmedNumber]);
                            setPhoneNumberInput("");
                            toast({
                              title: "Phone number added",
                              description: `${trimmedNumber} added to recipients`,
                            });
                          }
                        }}
                        disabled={!phoneNumberInput.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {manualPhoneNumbers.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Manual Recipients ({manualPhoneNumbers.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {manualPhoneNumbers.map((number, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {number}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  setManualPhoneNumbers(manualPhoneNumbers.filter((_, i) => i !== index));
                                  toast({
                                    title: "Phone number removed",
                                    description: `${number} removed from recipients`,
                                  });
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                  </div>

                  {communicationChannel === 'email' && (
                    <div>
                      <Label>Email Provider</Label>
                      <Select value={emailProvider} onValueChange={(value: 'sendgrid' | 'gmail') => setEmailProvider(value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {emailProviders.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        SendGrid for newsletters/promotions, Gmail for automated birthday emails
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="gap-2"
                      disabled={getSelectedRecipientsCount() === 0 || !messageContent || !communicationChannel || isSendingMessage}
                      onClick={async () => {
                        setIsSendingMessage(true);
                        try {
                          // Prepare recipient data - send ALL selected recipients from ALL categories
                          let recipientData: any = {
                            message: messageContent,
                            channel: communicationChannel,
                            emailProvider: communicationChannel === 'email' ? emailProvider : undefined
                          };

                          // Send all selected recipients from all categories (not just current category)
                          
                          // Add selected all members
                          if (selectedAllMembers.length > 0) {
                            if (!recipientData.memberIds) {
                              recipientData.memberIds = [];
                            }
                            recipientData.memberIds = [...recipientData.memberIds, ...selectedAllMembers];
                          }
                          
                          // Add selected groups
                          if (selectedGroups.length > 0) {
                            recipientData.groupIds = selectedGroups;
                          }

                          // Add selected volunteers
                          if (selectedVolunteers.length > 0) {
                            recipientData.volunteerTeamIds = selectedVolunteers;
                          }

                          // Add selected location members
                          if (selectedLocationMembers.length > 0) {
                            if (!recipientData.memberIds) {
                              recipientData.memberIds = [];
                            }
                            recipientData.memberIds = [...recipientData.memberIds, ...selectedLocationMembers];
                          }

                            // Add families, guests, and staff from selectedRecipients
                            if (selectedRecipients.length > 0) {
                              // Separate by category
                              const familyIds: string[] = [];
                              const guestIds: string[] = [];
                              const staffIds: string[] = [];

                              selectedRecipients.forEach(recipientId => {
                                const family = families.find((f: any) => String(f.familyID || f.id || f.familyId || f.x) === recipientId);
                                if (family) {
                                  familyIds.push(recipientId);
                                  return;
                                }

                                const guest = guests.find((g: any) => String(g.guestID || g.id || g.guestId || g.x) === recipientId);
                                if (guest) {
                                  guestIds.push(recipientId);
                                  return;
                                }

                                const staffMember = staff.find((s: any) => String(s.id || s.staffID || s.memberID || s.x) === recipientId);
                                if (staffMember) {
                                  staffIds.push(recipientId);
                                  return;
                                }
                              });

                              if (familyIds.length > 0) recipientData.familyIds = familyIds;
                              if (guestIds.length > 0) recipientData.guestIds = guestIds;
                              if (staffIds.length > 0) recipientData.staffIds = staffIds;
                            }

                          // Add manual phone numbers if any
                          if (manualPhoneNumbers.length > 0) {
                            recipientData.manualPhoneNumbers = manualPhoneNumbers;
                          }

                          await api.communications.send(recipientData);
                          
                          toast({
                            title: "Message Sent Successfully",
                            description: `Message sent to ${getSelectedRecipientsCount()} recipients`,
                          });
                          
                          // Clear form after successful send
                          setMessageContent("");
                          setSelectedRecipients([]);
                          setSelectedGroups([]);
                          setSelectedVolunteers([]);
                          setSelectedLocationMembers([]);
                          setSelectedAllMembers([]);
                          setRecipientCategory("");
                          setCommunicationChannel("");
                          setLocationMembers([]);
                          setManualPhoneNumbers([]);
                          setPhoneNumberInput("");
                          setLocationSearchTerm("");
                          setAllMembersSearch("");
                        } catch (error) {
                          console.error('Error sending message:', error);
                          toast({
                            title: "Failed to Send Message",
                            description: "Please try again or contact support if the issue persists",
                            variant: "destructive",
                          });
                        } finally {
                          setIsSendingMessage(false);
                        }
                      }}
                    >
                      <Send className="h-4 w-4" />
                      {isSendingMessage ? "Sending..." : "Send Message"}
                    </Button>
                    <Button variant="outline">
                      Save Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            {/* Scheduled Messages Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Scheduled Messages
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Schedule messages for gatherings, programs, and special events
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingSchedule(null);
                      setIsScheduleModalOpen(true);
                    }}
                    className="gap-2"
                  >
                    <CalendarRange className="h-4 w-4" />
                    New Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search scheduled messages..."
                    className="flex-1"
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                  />
                  <Select value={scheduleTypeFilter} onValueChange={setScheduleTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sunday service">Sunday Service</SelectItem>
                      <SelectItem value="program">Programs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scheduled Messages List - Scrollable */}
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                  {isLoadingScheduled ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                      <p>Loading scheduled messages...</p>
                    </div>
                  ) : !Array.isArray(scheduledMessages) || scheduledMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No scheduled messages</p>
                      <p className="text-sm">Create your first scheduled message to get started</p>
                    </div>
                  ) : (
                    Array.isArray(scheduledMessages) && scheduledMessages.map((schedule: any) => {
                      const getScheduleTypeBadgeColor = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case 'gathering': return 'bg-blue-500';
                          case 'sunday': return 'bg-purple-500';
                          case 'annual': return 'bg-orange-500';
                          case 'custom': return 'bg-green-500';
                          default: return 'bg-gray-500';
                        }
                      };

                      const getStatusBadgeVariant = (status: string) => {
                        switch (status?.toLowerCase()) {
                          case 'active': return 'default';
                          case 'pending': return 'secondary';
                          case 'sent': return 'outline';
                          case 'cancelled': return 'destructive';
                          default: return 'outline';
                        }
                      };

                      const formatScheduleTime = (date: string, time: string, frequency: string) => {
                        if (frequency && frequency !== 'once') {
                          const frequencyMap: any = {
                            'daily': 'Daily',
                            'every-2-days': 'Every 2 Days',
                            'every-3-days': 'Every 3 Days',
                            'weekly': 'Weekly',
                            'bi-weekly': 'Bi-Weekly',
                            'monthly': 'Monthly'
                          };
                          const label = frequencyMap[frequency] || frequency;
                          return `${label} at ${time || 'scheduled time'} (starts ${date ? new Date(date).toLocaleDateString() : 'TBD'})`;
                        }
                        return `Once on ${date ? new Date(date).toLocaleDateString() : 'Not set'} at ${time || 'Not set'}`;
                      };

                      const recipientCount = (() => {
                        try {
                          const recipients = JSON.parse(schedule.recipients || '{}');
                          let count = 0;
                          if (recipients.memberIds) count += recipients.memberIds.length;
                          if (recipients.groupIds) count += recipients.groupIds.length;
                          if (recipients.familyIds) count += recipients.familyIds.length;
                          if (recipients.staffIds) count += recipients.staffIds.length;
                          if (recipients.guestIds) count += recipients.guestIds.length;
                          return count;
                        } catch {
                          return 0;
                        }
                      })();

                      return (
                        <div key={schedule.scheduleID} className="flex items-start justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="default" className={getScheduleTypeBadgeColor(schedule.scheduleType)}>
                                {schedule.scheduleType || 'Custom'}
                              </Badge>
                              <Badge variant={getStatusBadgeVariant(schedule.status) as any} className="text-xs">
                                {schedule.status || 'Pending'}
                              </Badge>
                              {schedule.frequency && schedule.frequency !== 'once' && (
                                <Badge variant="secondary" className="text-xs">
                                  🔄 Recurring
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold mb-1">{schedule.title || 'Untitled Schedule'}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {schedule.message?.substring(0, 100)}{schedule.message?.length > 100 ? '...' : ''}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatScheduleTime(schedule.scheduleDate, schedule.scheduleTime, schedule.frequency)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {schedule.recipientType || 'Custom'} ({recipientCount} recipients)
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {schedule.channel || 'Not set'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => handleCancelSchedule(schedule)}
                            >
                              {schedule.status?.toLowerCase() === 'active' ? 'Cancel' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Automated Messages Configuration Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCcw className="h-5 w-5" />
                      Automated Message Configurations
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure automatic messages triggered by events and member activities
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingAutomation(null);
                      setIsAutomatedModalOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Automation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {automatedConfigs.map((config) => {
                    const getIcon = (type: string) => {
                      switch(type) {
                        case 'birthday': return <Heart className="h-5 w-5 text-pink-500" />;
                        case 'volunteer': return <UserCheck className="h-5 w-5 text-blue-500" />;
                        case 'guest_welcome': return <Users className="h-5 w-5 text-green-500" />;
                        case 'absent_followup': return <AlertCircle className="h-5 w-5 text-orange-500" />;
                        default: return <Bell className="h-5 w-5 text-gray-500" />;
                      }
                    };

                    const getDescription = (type: string) => {
                      switch(type) {
                        case 'birthday': return 'Automatically send birthday greetings to members on their special day';
                        case 'volunteer': return "Notify volunteers when they're assigned to teams and remind them 24-48 hours before duty";
                        case 'guest_welcome': return 'Send welcome messages to first-time guests and follow up after their visit';
                        case 'absent_followup': return "Reach out to members who haven't attended services for a specified period";
                        default: return 'Automated message configuration';
                      }
                    };

                    return (
                      <div key={config.id} className="flex items-start justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getIcon(config.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{config.name}</h4>
                              <Badge 
                                variant={config.enabled ? "default" : "secondary"} 
                                className={config.enabled ? "bg-green-500 text-xs" : "text-xs"}
                              >
                                {config.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getDescription(config.type)}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {config.triggerTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {config.channel.split(',').join(' + ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingAutomation(config);
                              setIsAutomatedModalOpen(true);
                            }}
                          >
                            Configure
                          </Button>
                          <Button 
                            variant={config.enabled ? "outline" : "default"} 
                            size="sm" 
                            className={config.enabled ? "text-destructive" : "bg-green-500"}
                            onClick={() => {
                              setAutomatedConfigs(automatedConfigs.map(c => 
                                c.id === config.id ? { ...c, enabled: !c.enabled } : c
                              ));
                              toast({
                                title: config.enabled ? "Automation Disabled" : "Automation Enabled",
                                description: `${config.name} has been ${config.enabled ? 'disabled' : 'enabled'}.`
                              });
                            }}
                          >
                            {config.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Communications History</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchCommunicationsHistory}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={historyFilters.startDate}
                      onChange={(e) => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={historyFilters.endDate}
                      onChange={(e) => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Channel</Label>
                    <Select value={historyFilters.channel} onValueChange={(value) => setHistoryFilters({ ...historyFilters, channel: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Channels</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={historyFilters.status} onValueChange={(value) => setHistoryFilters({ ...historyFilters, status: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* History List */}
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : communicationsHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No communications found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communicationsHistory.map((comm: any) => (
                      <div key={comm.communicationID} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{comm.subject || 'No Subject'}</h3>
                            {comm.provider && (
                              <Badge variant="outline" className="text-xs">{comm.provider}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {comm.messageType === 'WhatsApp' && <MessageSquare className="h-3 w-3" />}
                              {comm.messageType === 'Email' && <Mail className="h-3 w-3" />}
                              {comm.messageType === 'SMS' && <Phone className="h-3 w-3" />}
                              {comm.messageType}
                            </span>
                            <span>{new Date(comm.createdAt).toLocaleString()}</span>
                            {comm.cost && Number(comm.cost) > 0 && <span>₦{Number(comm.cost).toFixed(2)}</span>}
                          </div>
                          {comm.failureReason && (
                            <p className="text-xs text-destructive mt-1">{comm.failureReason}</p>
                          )}
                        </div>
                        <Badge 
                          variant="outline"
                          className={
                            comm.status.toLowerCase() === 'sent' || comm.status.toLowerCase() === 'delivered'
                              ? "bg-green-100 text-green-800 border-green-200"
                              : comm.status.toLowerCase() === 'failed'
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {comm.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Saved Drafts</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Messages you've saved for later
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDrafts}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDrafts ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
                  </div>
                ) : drafts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No drafts saved</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((draft: any) => (
                      <div key={draft.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{draft.subject || 'No Subject'}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {draft.recipientCount || 0} recipients • {draft.messageType} • 
                            Last modified: {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {draft.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            disabled={sendingDraftId === draft.id}
                            onClick={() => handleSendDraft(draft.id)}
                          >
                            {sendingDraftId === draft.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Communications Analytics
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAnalytics}
                  disabled={isLoadingAnalytics}
                >
                  <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingAnalytics ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : !analytics ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No analytics data available</p>
                    <Button variant="outline" onClick={fetchAnalytics} className="mt-4">
                      Load Analytics
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Cost Analysis Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Cost Analysis</h3>
                      </div>
                      
                      {/* Total Cost Card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Total Spend</p>
                              <p className="text-2xl font-bold">₦{analytics.costAnalysis?.totalCost?.toFixed(2) || '0.00'}</p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Average Cost Card */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Avg Per Message</p>
                              <p className="text-2xl font-bold">₦{analytics.costAnalysis?.averageCostPerMessage?.toFixed(2) || '0.00'}</p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Messages Sent Card */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Messages Sent</p>
                              <p className="text-2xl font-bold">{analytics.costAnalysis?.totalMessages || 0}</p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Date Range Card */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Period</p>
                              <p className="text-sm font-medium">
                                {analytics.dateRange?.start && analytics.dateRange?.end 
                                  ? `${new Date(analytics.dateRange.start).toLocaleDateString()} - ${new Date(analytics.dateRange.end).toLocaleDateString()}`
                                  : 'All Time'
                                }
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Cost by Channel */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {analytics.costAnalysis?.costByChannel && Object.entries(analytics.costAnalysis.costByChannel).map(([channel, data]: [string, any]) => (
                          <Card key={channel}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground capitalize">{channel}</p>
                                  <p className="text-xl font-bold">₦{data.cost?.toFixed(2) || '0.00'}</p>
                                  <p className="text-xs text-muted-foreground">{data.count || 0} messages</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  {channel === 'whatsapp' && <MessageSquare className="h-6 w-6 text-primary" />}
                                  {channel === 'email' && <Mail className="h-6 w-6 text-primary" />}
                                  {channel === 'sms' && <Phone className="h-6 w-6 text-primary" />}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Cost by Provider */}
                      {analytics.costAnalysis?.costByProvider && Object.keys(analytics.costAnalysis.costByProvider).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Cost by Provider</h4>
                          <div className="space-y-2">
                            {Object.entries(analytics.costAnalysis.costByProvider).map(([provider, data]: [string, any]) => (
                              <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  <div>
                                    <p className="font-medium capitalize">{provider}</p>
                                    <p className="text-sm text-muted-foreground">{data.count || 0} messages</p>
                                  </div>
                                </div>
                                <p className="font-semibold">₦{data.cost?.toFixed(2) || '0.00'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Peak Times Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Peak Sending Times</h3>
                      </div>

                      {/* Recommendation Banner */}
                      {analytics.peakTimes?.recommendation && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="font-medium text-primary">Optimization Tip</p>
                              <p className="text-sm text-muted-foreground mt-1">{analytics.peakTimes.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Peak Hour and Day */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Peak Hour</p>
                              <p className="text-xl font-bold">{analytics.peakTimes?.peakHour?.label || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{analytics.peakTimes?.peakHour?.count || 0} messages sent</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Peak Day</p>
                              <p className="text-xl font-bold">{analytics.peakTimes?.peakDay?.name || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{analytics.peakTimes?.peakDay?.count || 0} messages sent</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Hourly Distribution Preview */}
                      {analytics.peakTimes?.hourlyDistribution && analytics.peakTimes.hourlyDistribution.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Hourly Distribution</h4>
                          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                            {analytics.peakTimes.hourlyDistribution.map((hour: any, index: number) => (
                              <div key={index} className="flex flex-col items-center gap-1">
                                <div 
                                  className="w-full bg-primary/20 rounded hover:bg-primary/30 transition-colors"
                                  style={{ height: `${Math.max(20, (hour.count / Math.max(...analytics.peakTimes.hourlyDistribution.map((h: any) => h.count))) * 60)}px` }}
                                  title={`${hour.hour}:00 - ${hour.count} messages`}
                                />
                                <span className="text-xs text-muted-foreground">{hour.hour}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delivery Rates Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Delivery Rates</h3>
                      </div>

                      {/* Overall Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className={analytics.deliveryRates?.overall?.successRate >= 80 ? "border-green-500/50 bg-green-50/50" : ""}>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Success Rate</p>
                              <p className="text-2xl font-bold text-green-600">
                                {analytics.deliveryRates?.overall?.successRate?.toFixed(1) || '0'}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(analytics.deliveryRates?.overall?.sent || 0) + (analytics.deliveryRates?.overall?.delivered || 0)} successful
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Delivered</p>
                              <p className="text-2xl font-bold">{analytics.deliveryRates?.overall?.delivered || 0}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={analytics.deliveryRates?.overall?.failureRate > 20 ? "border-red-500/50 bg-red-50/50" : ""}>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Failed</p>
                              <p className="text-2xl font-bold text-red-600">{analytics.deliveryRates?.overall?.failed || 0}</p>
                              <p className="text-xs text-muted-foreground">
                                {analytics.deliveryRates?.overall?.failureRate?.toFixed(1) || '0'}% failure rate
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Pending</p>
                              <p className="text-2xl font-bold">{analytics.deliveryRates?.overall?.pending || 0}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* By Channel Breakdown */}
                      {analytics.deliveryRates?.byChannel && Object.keys(analytics.deliveryRates.byChannel).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Performance by Channel</h4>
                          <div className="space-y-2">
                            {Object.entries(analytics.deliveryRates.byChannel).map(([channel, data]: [string, any]) => (
                              <div key={channel} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                                    {channel === 'email' && <Mail className="h-4 w-4" />}
                                    {channel === 'sms' && <Phone className="h-4 w-4" />}
                                    <span className="font-medium capitalize">{channel}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-green-600 font-medium">{data.successRate?.toFixed(1)}% success</span>
                                    <span className="text-red-600">{data.failureRate?.toFixed(1)}% failed</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Sent</p>
                                    <p className="font-medium">{data.sent || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Delivered</p>
                                    <p className="font-medium">{data.delivered || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Failed</p>
                                    <p className="font-medium">{data.failed || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Pending</p>
                                    <p className="font-medium">{data.pending || 0}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Schedule Message Modal */}
        {isScheduleModalOpen && (
          <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Edit Scheduled Message' : 'Schedule New Message'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details below to schedule your message
                </DialogDescription>
              </DialogHeader>
              <ScheduleMessageForm
                schedule={editingSchedule}
                onSave={handleSaveSchedule}
                onCancel={() => {
                  setIsScheduleModalOpen(false);
                  setEditingSchedule(null);
                }}
                recipientSelectionUI={
                  recipientsError ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error loading recipients</AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{recipientsError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchRecipients}
                          disabled={isLoadingRecipients}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Recipient Category</Label>
                        <Select value={recipientCategory} onValueChange={handleRecipientCategoryChange} disabled={isLoadingRecipients}>
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
                      {recipientCategory === "all_members" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Select Active Members</span>
                            <Badge variant="secondary">{allMembers.length} total members</Badge>
                          </div>

                          {isLoadingAllMembers ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Search members..."
                                  value={allMembersSearch}
                                  onChange={(e) => setAllMembersSearch(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    try {
                                      const allIds = allMembers
                                        .filter((m: any) => m.memberID || m.id || m.x)
                                        .map((m: any) => String(m.memberID || m.id || m.x));
                                      
                                      // Check if all are selected
                                      const allSelected = selectedAllMembers.length >= allIds.length && allIds.length > 0;
                                      
                                      // Use setTimeout to batch the state update and prevent UI freeze
                                      setTimeout(() => {
                                        if (allSelected) {
                                          setSelectedAllMembers([]);
                                        } else {
                                          setSelectedAllMembers(allIds);
                                        }
                                      }, 0);
                                    } catch (error) {
                                      console.error('Error selecting all members:', error);
                                    }
                                  }}
                                >
                                  {selectedAllMembers.length >= allMembers.length && allMembers.length > 0 ? 'Deselect All' : 'Select All'}
                                </Button>
                              </div>

                              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                                {allMembers
                                  .filter((member: any) => {
                                    if (!allMembersSearch) return true;
                                    const searchLower = allMembersSearch.toLowerCase();
                                    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
                                    const email = (member.email || '').toLowerCase();
                                    const phone = (member.phoneNumber || member.phone || '').toLowerCase();
                                    return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
                                  })
                                  .map((member: any) => {
                                    const memberId = String(member.memberID || member.id || member.x);
                                    const isSelected = selectedAllMembers.includes(memberId);
                                    
                                    return (
                                      <div
                                        key={memberId}
                                        className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                      >
                                        <Checkbox
                                          id={`member-${memberId}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedAllMembers([...selectedAllMembers, memberId]);
                                            } else {
                                              setSelectedAllMembers(selectedAllMembers.filter(id => id !== memberId));
                                            }
                                          }}
                                        />
                                        <label htmlFor={`member-${memberId}`} className="flex-1 min-w-0 cursor-pointer">
                                          <div className="text-sm font-medium">
                                            {member.firstName} {member.lastName}
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate">
                                            {member.email || member.phoneNumber || member.phone || 'No contact info'}
                                          </div>
                                        </label>
                                      </div>
                                    );
                                  })}
                              </div>

                              <div className="text-xs text-muted-foreground pt-2 border-t">
                                {selectedAllMembers.length} of {allMembers.length} members selected
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {recipientCategory === "groups" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Groups/Departments</Label>
                            {groups.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const groupIds = groups.map((g: any) => String(g.x || g.id || g.groupID));
                                  const allGroupsSelected = groupIds.every((id: string) => selectedGroups.includes(id));
                                  
                                  if (allGroupsSelected) {
                                    setSelectedGroups([]);
                                  } else {
                                    setSelectedGroups(groupIds);
                                  }
                                }}
                              >
                                {groups.every((g: any) => selectedGroups.includes(String(g.x || g.id || g.groupID))) ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </div>
                          {groups.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No groups available</div>
                          ) : (
                            <>
                              <Input placeholder="Search groups..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
                              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                                {groups.filter((group: any) => {
                                  const searchTerm = groupSearch.toLowerCase();
                                  return !searchTerm || (group?.name || group?.groupName || '').toLowerCase().includes(searchTerm);
                                }).map((group: any) => {
                                  const groupId = String(group.x || group.id || group.groupID);
                                  return (
                                    <div key={groupId} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={`group-${groupId}`}
                                        checked={selectedGroups.includes(groupId)}
                                        onCheckedChange={(checked) => handleGroupSelection(groupId, checked as boolean)}
                                      />
                                      <label htmlFor={`group-${groupId}`} className="text-sm flex-1 cursor-pointer">
                                        {group.name || group.groupName || 'Unnamed Group'}
                                      </label>
                                      <Badge variant="outline" className="text-xs">{groupMemberCounts[groupId] || 0}</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {recipientCategory === "families" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Families</Label>
                            {families.length > 0 && (
                              <Button variant="ghost" size="sm" onClick={() => {
                                const familyIds = families.map((f: any) => String(f.familyID || f.id || f.x));
                                const allFamiliesSelected = familyIds.every((id: string) => selectedRecipients.includes(id));
                                
                                if (allFamiliesSelected) {
                                  // Remove only family IDs, keep others
                                  setSelectedRecipients(selectedRecipients.filter((id: string) => !familyIds.includes(id)));
                                } else {
                                  // Add all family IDs, keep existing
                                  const newIds = familyIds.filter((id: string) => !selectedRecipients.includes(id));
                                  setSelectedRecipients([...selectedRecipients, ...newIds]);
                                }
                              }}>
                                {families.every((f: any) => selectedRecipients.includes(String(f.familyID || f.id || f.x))) ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </div>
                          {families.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No families available</div>
                          ) : (
                            <>
                              <Input placeholder="Search families..." value={familySearch} onChange={(e) => setFamilySearch(e.target.value)} />
                              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                                {families.filter((family: any) => {
                                  const searchTerm = familySearch.toLowerCase();
                                  return !searchTerm || (family?.name || family?.familyName || '').toLowerCase().includes(searchTerm);
                                }).map((family: any) => {
                                  const familyId = String(family.familyID || family.id || family.x);
                                  return (
                                    <div key={familyId} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={`family-${familyId}`}
                                        checked={selectedRecipients.includes(familyId)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedRecipients([...selectedRecipients, familyId]);
                                          } else {
                                            setSelectedRecipients(selectedRecipients.filter(id => id !== familyId));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`family-${familyId}`} className="text-sm flex-1 cursor-pointer">
                                        {family.name || family.familyName || 'Unnamed Family'}
                                      </label>
                                      <Badge variant="outline" className="text-xs">{family.memberCount || 0} members</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {recipientCategory === "guests" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Guests</Label>
                            {guests.length > 0 && (
                              <Button variant="ghost" size="sm" onClick={() => {
                                const guestIds = guests.map((g: any) => String(g.guestID || g.id || g.x));
                                const allGuestsSelected = guestIds.every((id: string) => selectedRecipients.includes(id));
                                
                                if (allGuestsSelected) {
                                  // Remove only guest IDs, keep others
                                  setSelectedRecipients(selectedRecipients.filter((id: string) => !guestIds.includes(id)));
                                } else {
                                  // Add all guest IDs, keep existing
                                  const newIds = guestIds.filter((id: string) => !selectedRecipients.includes(id));
                                  setSelectedRecipients([...selectedRecipients, ...newIds]);
                                }
                              }}>
                                {guests.every((g: any) => selectedRecipients.includes(String(g.guestID || g.id || g.x))) ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </div>
                          {guests.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No guests available</div>
                          ) : (
                            <>
                              <Input placeholder="Search guests..." value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} />
                              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                                {guests.filter((guest: any) => {
                                  const searchTerm = guestSearch.toLowerCase();
                                  return !searchTerm || (guest?.name || '').toLowerCase().includes(searchTerm);
                                }).map((guest: any) => {
                                  const guestId = String(guest.guestID || guest.id || guest.x);
                                  return (
                                    <div key={guestId} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={`guest-${guestId}`}
                                        checked={selectedRecipients.includes(guestId)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedRecipients([...selectedRecipients, guestId]);
                                          } else {
                                            setSelectedRecipients(selectedRecipients.filter(id => id !== guestId));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`guest-${guestId}`} className="text-sm flex-1 cursor-pointer">
                                        {guest.name || 'Unnamed Guest'}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {recipientCategory === "staff" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Staff Members</Label>
                            {staff.length > 0 && (
                              <Button variant="ghost" size="sm" onClick={() => {
                                const staffIds = staff.map((s: any) => String(s.id || s.staffID || s.x));
                                const allStaffSelected = staffIds.every((id: string) => selectedRecipients.includes(id));
                                
                                if (allStaffSelected) {
                                  // Remove only staff IDs, keep others
                                  setSelectedRecipients(selectedRecipients.filter((id: string) => !staffIds.includes(id)));
                                } else {
                                  // Add all staff IDs, keep existing
                                  const newIds = staffIds.filter((id: string) => !selectedRecipients.includes(id));
                                  setSelectedRecipients([...selectedRecipients, ...newIds]);
                                }
                              }}>
                                {staff.every((s: any) => selectedRecipients.includes(String(s.id || s.staffID || s.x))) ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </div>
                          {staff.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No staff members available</div>
                          ) : (
                            <>
                              <Input placeholder="Search staff..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} />
                              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                                {staff.filter((staffMember: any) => {
                                  const searchTerm = staffSearch.toLowerCase();
                                  return !searchTerm || (staffMember?.name || '').toLowerCase().includes(searchTerm);
                                }).map((staffMember: any) => {
                                  const staffId = String(staffMember.id || staffMember.staffID || staffMember.x);
                                  return (
                                    <div key={staffId} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={`staff-${staffId}`}
                                        checked={selectedRecipients.includes(staffId)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedRecipients([...selectedRecipients, staffId]);
                                          } else {
                                            setSelectedRecipients(selectedRecipients.filter(id => id !== staffId));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`staff-${staffId}`} className="text-sm flex-1 cursor-pointer">
                                        {staffMember.name || 'Unnamed Staff'}
                                      </label>
                                      <Badge variant="outline" className="text-xs">{staffMember.role || 'Staff'}</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {recipientCategory === "volunteers" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Volunteer Roles</Label>
                            {volunteerTeams.length > 0 && (
                              <Button variant="ghost" size="sm" onClick={() => {
                                const volunteerIds = volunteerTeams.map((v: any) => String(v.roleID || v.id || v.x));
                                const allVolunteersSelected = volunteerIds.every((id: string) => selectedVolunteers.includes(id));
                                
                                if (allVolunteersSelected) {
                                  setSelectedVolunteers([]);
                                } else {
                                  setSelectedVolunteers(volunteerIds);
                                }
                              }}>
                                {volunteerTeams.every((v: any) => selectedVolunteers.includes(String(v.roleID || v.id || v.x))) ? 'Deselect All' : 'Select All'}
                              </Button>
                            )}
                          </div>
                          {volunteerTeams.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No volunteer roles available</div>
                          ) : (
                            <>
                              <Input placeholder="Search volunteer roles..." value={volunteerSearch} onChange={(e) => setVolunteerSearch(e.target.value)} />
                              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                                {volunteerTeams.filter((volunteer: any) => {
                                  const searchTerm = volunteerSearch.toLowerCase();
                                  return !searchTerm || (volunteer?.roleName || volunteer?.name || '').toLowerCase().includes(searchTerm);
                                }).map((volunteer: any) => {
                                  const volunteerId = String(volunteer.roleID || volunteer.id || volunteer.x);
                                  return (
                                    <div key={volunteerId} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={`volunteer-${volunteerId}`}
                                        checked={selectedVolunteers.includes(volunteerId)}
                                        onCheckedChange={(checked) => handleVolunteerSelection(volunteerId, checked as boolean)}
                                      />
                                      <label htmlFor={`volunteer-${volunteerId}`} className="text-sm flex-1 cursor-pointer">
                                        {volunteer.roleName || volunteer.name || 'Unnamed Role'}
                                      </label>
                                      <Badge variant="outline" className="text-xs">{volunteerMemberCounts[volunteerId] || 0}</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {recipientCategory === "location" && (
                        <div className="space-y-3">
                          <Label>Location-based Selection</Label>
                          <div className="space-y-2">
                            <Label className="text-sm">Select State</Label>
                            <Select value={selectedState} onValueChange={(value) => {
                              setSelectedState(value);
                              setSelectedLGA("");
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a state" />
                              </SelectTrigger>
                              <SelectContent>
                                {nigeriaStatesAndLGAs.map((state) => (
                                  <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedState && (
                            <div className="space-y-2">
                              <Label className="text-sm">Select Local Government Area</Label>
                              <Select value={selectedLGA} onValueChange={async (lga) => {
                                setSelectedLGA(lga);
                                if (lga) await fetchMembersByLocation(selectedState, lga);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an LGA" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getLGAsByState(selectedState).map((lga) => (
                                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {selectedLGA && (
                            <div className="mt-4 p-3 bg-muted/20 rounded-lg space-y-3">
                              {isLoadingLocationMembers ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  <span className="ml-2 text-sm">Loading members...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Members in {selectedLGA}, {selectedState}</span>
                                    <Badge variant="secondary">{locationMembers.length} members</Badge>
                                  </div>

                                  {locationMembers.length > 0 && (
                                    <>
                                      <div className="flex gap-2">
                                        <Input placeholder="Search members..." value={locationSearchTerm} onChange={(e) => setLocationSearchTerm(e.target.value)} className="flex-1" />
                                        <Button type="button" variant="outline" size="sm" onClick={() => {
                                          const allMemberIds = locationMembers
                                            .filter((m: any) => m.memberID || m.id || m.x)
                                            .map((m: any) => String(m.memberID || m.id || m.x));
                                          const allSelected = selectedLocationMembers.length >= allMemberIds.length && allMemberIds.length > 0;
                                          
                                          if (allSelected) {
                                            setSelectedLocationMembers([]);
                                          } else {
                                            setSelectedLocationMembers(allMemberIds);
                                          }
                                        }}>
                                          {selectedLocationMembers.length >= locationMembers.length && locationMembers.length > 0 ? 'Deselect All' : 'Select All'}
                                        </Button>
                                      </div>

                                      <div className="max-h-64 overflow-y-auto space-y-2">
                                        {locationMembers.filter((member: any) => {
                                          if (!locationSearchTerm) return true;
                                          const searchLower = locationSearchTerm.toLowerCase();
                                          const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
                                          return fullName.includes(searchLower);
                                        }).map((member: any) => {
                                          const memberId = String(member.memberID || member.id || member.x);
                                          const isSelected = selectedLocationMembers.includes(memberId);
                                          
                                          return (
                                            <div key={memberId} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                                              <Checkbox
                                                id={`location-member-${memberId}`}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedLocationMembers([...selectedLocationMembers, memberId]);
                                                  } else {
                                                    setSelectedLocationMembers(selectedLocationMembers.filter(id => id !== memberId));
                                                  }
                                                }}
                                              />
                                              <label htmlFor={`location-member-${memberId}`} className="flex-1 min-w-0 cursor-pointer">
                                                <div className="text-sm font-medium">{member.firstName} {member.lastName}</div>
                                                <div className="text-xs text-muted-foreground truncate">{member.email || member.phoneNumber || 'No contact info'}</div>
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      <div className="text-xs text-muted-foreground pt-2 border-t">
                                        {selectedLocationMembers.length} of {locationMembers.length} members selected
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show selection summary */}
                      {getSelectedRecipientsCount() > 0 && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Total Recipients:</span>
                            <Badge variant="default" className="text-base px-3 py-1">
                              {getSelectedRecipientsCount().toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && (
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  This action cannot be undone
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to {scheduleToDelete?.status?.toLowerCase() === 'active' ? 'cancel' : 'delete'} this scheduled message?
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-sm">{scheduleToDelete?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scheduleToDelete?.message?.substring(0, 100)}{scheduleToDelete?.message?.length > 100 ? '...' : ''}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setScheduleToDelete(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDelete}
                  >
                    Yes, {scheduleToDelete?.status?.toLowerCase() === 'active' ? 'Cancel' : 'Delete'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Automated Message Configuration Modal */}
        {isAutomatedModalOpen && (
          <Dialog open={isAutomatedModalOpen} onOpenChange={setIsAutomatedModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAutomation ? 'Edit Automated Message Configuration' : 'Create New Automated Message'}
                </DialogTitle>
                <DialogDescription>
                  Configure automatic messages that are triggered by specific events
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const config = {
                  id: editingAutomation?.id || Date.now(),
                  name: formData.get('name') as string,
                  type: formData.get('type') as string,
                  enabled: editingAutomation ? editingAutomation.enabled : true,
                  channel: formData.get('channel') as string,
                  triggerTime: formData.get('triggerTime') as string,
                  message: formData.get('message') as string
                };

                if (editingAutomation) {
                  setAutomatedConfigs(automatedConfigs.map(c => 
                    c.id === editingAutomation.id ? config : c
                  ));
                  toast({
                    title: "Configuration Updated",
                    description: "Automated message configuration has been updated successfully."
                  });
                } else {
                  setAutomatedConfigs([...automatedConfigs, config]);
                  toast({
                    title: "Configuration Created",
                    description: "New automated message configuration has been created."
                  });
                }

                setIsAutomatedModalOpen(false);
                setEditingAutomation(null);
              }} className="space-y-6">

                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingAutomation?.name}
                    placeholder="E.g., Birthday Messages, New Member Welcome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Automation Type</Label>
                  <Select name="type" defaultValue={editingAutomation?.type || 'birthday'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select automation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday Messages</SelectItem>
                      <SelectItem value="volunteer">Volunteer Assignment</SelectItem>
                      <SelectItem value="guest_welcome">New Guest Welcome</SelectItem>
                      <SelectItem value="absent_followup">Absent Member Follow-up</SelectItem>
                      <SelectItem value="event_reminder">Event Reminder</SelectItem>
                      <SelectItem value="donation_thank_you">Donation Thank You</SelectItem>
                      <SelectItem value="anniversary">Anniversary Messages</SelectItem>
                      <SelectItem value="custom">Custom Trigger</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the event that will trigger this automated message
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerTime">Trigger Timing</Label>
                  <Select name="triggerTime" defaultValue={editingAutomation?.triggerTime || 'instant'}>
                    <SelectTrigger>
                      <SelectValue placeholder="When to send the message" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Immediately (Instant)</SelectItem>
                      <SelectItem value="09:00">Daily at 9:00 AM</SelectItem>
                      <SelectItem value="same_day">Same Day (Evening)</SelectItem>
                      <SelectItem value="1_day">1 Day After Event</SelectItem>
                      <SelectItem value="2_days">2 Days After Event</SelectItem>
                      <SelectItem value="1_week">1 Week After Event</SelectItem>
                      <SelectItem value="2_weeks">2 Weeks After Event</SelectItem>
                      <SelectItem value="3_weeks">3 Weeks After Event</SelectItem>
                      <SelectItem value="1_month">1 Month After Event</SelectItem>
                      <SelectItem value="24h_before">24 Hours Before Event</SelectItem>
                      <SelectItem value="48h_before">48 Hours Before Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Specify when the message should be sent relative to the trigger event
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Communication Channels</Label>
                  <Select name="channel" defaultValue={editingAutomation?.channel || 'whatsapp'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="whatsapp,email">WhatsApp + Email</SelectItem>
                      <SelectItem value="whatsapp,sms">WhatsApp + SMS</SelectItem>
                      <SelectItem value="sms,email">SMS + Email</SelectItem>
                      <SelectItem value="whatsapp,sms,email">All Channels</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose which communication channels to use for this automation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message Template</Label>
                  <Textarea
                    id="message"
                    name="message"
                    defaultValue={editingAutomation?.message}
                    placeholder="Enter your message template. You can use variables like {firstName}, {lastName}, {eventName}, etc."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use placeholders like {'{firstName}'}, {'{lastName}'}, {'{eventName}'} which will be replaced with actual data
                  </p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label className="text-base font-semibold">Target Recipients</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="targetMembers" className="rounded" defaultChecked />
                      <Label htmlFor="targetMembers" className="cursor-pointer font-normal">
                        Active Members
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="targetGuests" className="rounded" />
                      <Label htmlFor="targetGuests" className="cursor-pointer font-normal">
                        Guests
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="targetVolunteers" className="rounded" />
                      <Label htmlFor="targetVolunteers" className="cursor-pointer font-normal">
                        Volunteers
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="targetStaff" className="rounded" />
                      <Label htmlFor="targetStaff" className="cursor-pointer font-normal">
                        Staff
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which groups should receive this automated message
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAutomatedModalOpen(false);
                      setEditingAutomation(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAutomation ? 'Update Configuration' : 'Create Automation'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CommunicationsPage;