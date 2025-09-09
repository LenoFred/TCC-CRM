import { useState } from "react";
import { Calendar, Clock, Users, Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ScheduledMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduledMessagesModal = ({ isOpen, onClose }: ScheduledMessagesModalProps) => {
  const { toast } = useToast();
  const [messageType, setMessageType] = useState<"birthday" | "scheduled" | "automated">("scheduled");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("all_members");
  const [channels, setChannels] = useState({
    email: true,
    whatsapp: false,
    sms: false,
  });
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurringPattern, setRecurringPattern] = useState("weekly");

  const handleChannelChange = (channel: keyof typeof channels, checked: boolean) => {
    setChannels(prev => ({
      ...prev,
      [channel]: checked
    }));
  };

  const handleScheduleMessage = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and message content.",
        variant: "destructive",
      });
      return;
    }

    if (messageType === "scheduled" && (!scheduleDate || !scheduleTime)) {
      toast({
        title: "Missing Schedule",
        description: "Please set the date and time for the scheduled message.",
        variant: "destructive",
      });
      return;
    }

    const selectedChannels = Object.entries(channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);

    if (selectedChannels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one communication channel.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Scheduled",
      description: `Your ${messageType} message has been scheduled successfully.`,
    });

    // Reset form
    setTitle("");
    setMessage("");
    setScheduleDate("");
    setScheduleTime("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Message
          </DialogTitle>
          <DialogDescription>
            Create scheduled or automated messages for your members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Type */}
          <div className="space-y-3">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">One-time Scheduled</SelectItem>
                <SelectItem value="birthday">Birthday Messages</SelectItem>
                <SelectItem value="automated">Event-based Automated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Message Title *</Label>
            <Input
              id="title"
              placeholder="Enter message title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">Message Content *</Label>
            <Textarea
              id="message"
              placeholder="Enter your message content here..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use {"{name}"} to personalize with member names
            </p>
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label>Recipients</Label>
            <Select value={recipients} onValueChange={setRecipients}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_members">All Active Members</SelectItem>
                <SelectItem value="families">All Families</SelectItem>
                <SelectItem value="volunteers">All Volunteers</SelectItem>
                <SelectItem value="staff">Staff Members</SelectItem>
                <SelectItem value="custom">Custom List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Communication Channels */}
          <div className="space-y-3">
            <Label>Communication Channels</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="email"
                  checked={channels.email}
                  onCheckedChange={(checked) => handleChannelChange("email", checked as boolean)}
                />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="whatsapp"
                  checked={channels.whatsapp}
                  onCheckedChange={(checked) => handleChannelChange("whatsapp", checked as boolean)}
                />
                <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp (Primary)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="sms"
                  checked={channels.sms}
                  onCheckedChange={(checked) => handleChannelChange("sms", checked as boolean)}
                />
                <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  SMS (Fallback)
                </Label>
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          {messageType === "scheduled" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Schedule Type</Label>
                <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Send Once</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduleDate">Date *</Label>
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduleTime">Time *</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>

              {scheduleType === "recurring" && (
                <div className="space-y-2">
                  <Label>Repeat Pattern</Label>
                  <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Birthday Message Settings */}
          {messageType === "birthday" && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium mb-2">Birthday Message Settings</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This message will be automatically sent to members on their birthday
              </p>
              <div className="space-y-2">
                <Label>Send Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  defaultValue="09:00"
                />
              </div>
            </div>
          )}

          {/* Automated Message Settings */}
          {messageType === "automated" && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium mb-2">Automation Trigger</h3>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_member">New Member Welcome</SelectItem>
                  <SelectItem value="missed_service">Missed 2+ Services</SelectItem>
                  <SelectItem value="volunteer_reminder">Volunteer Reminder</SelectItem>
                  <SelectItem value="event_reminder">Event Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleScheduleMessage}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};