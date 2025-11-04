import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send, Users, Mail, Smartphone, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCommunication } from "@/hooks/useBusinessLogic";

interface BulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (messageData: any) => void;
  recipients?: any[];
}

export const BulkMessageModal = ({ isOpen, onClose, onSend, recipients = [] }: BulkMessageModalProps) => {
  const { toast } = useToast();
  
  // Use business logic hook
  const { sendBulk, loading, error } = useCommunication();
  
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    channels: [] as string[],
    scheduleType: "now"
  });
  const [sendResult, setSendResult] = useState<{sent: number, failed: number} | null>(null);

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        channels: [...prev.channels, channel]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        channels: prev.channels.filter(c => c !== channel)
      }));
    }
  };

  const handleSend = async () => {
    if (!formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (formData.channels.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one communication channel.",
        variant: "destructive",
      });
      return;
    }

    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send via each selected channel
      for (const channel of formData.channels) {
        const result = await sendBulk(
          recipients,
          channel as 'sms' | 'email' | 'whatsapp',
          formData.message,
          formData.channels.includes('email') ? formData.subject : undefined
        );
        
        setSendResult(result);
      }

      // Call parent callback
      const messageData = {
        ...formData,
        recipients: recipients.length,
        timestamp: new Date().toISOString(),
      };
      onSend(messageData);

      toast({
        title: "Messages Sent",
        description: `Successfully sent bulk message to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} via ${formData.channels.join(', ')}.`,
      });

      // Reset form
      setFormData({
        subject: "",
        message: "",
        channels: [],
        scheduleType: "now"
      });
      setSendResult(null);

      onClose();
    } catch (err) {
      console.error('Bulk send error:', err);
      toast({
        title: "Send Failed",
        description: error || "Failed to send bulk messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Bulk Message
          </DialogTitle>
          <DialogDescription>
            Compose and send a message to selected recipients
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recipients Summary */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium text-primary">
                Recipients ({recipients.length})
              </Label>
            </div>
            <div className="flex flex-wrap gap-1">
              {recipients.slice(0, 10).map((recipient, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {recipient.name || `Recipient ${index + 1}`}
                </Badge>
              ))}
              {recipients.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{recipients.length - 10} more
                </Badge>
              )}
            </div>
          </div>

          {/* Communication Channels */}
          <div>
            <Label className="text-base font-medium mb-3 block">Communication Channels</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={formData.channels.includes("email")}
                  onCheckedChange={(checked) => handleChannelChange("email", checked as boolean)}
                />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={formData.channels.includes("whatsapp")}
                  onCheckedChange={(checked) => handleChannelChange("whatsapp", checked as boolean)}
                />
                <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={formData.channels.includes("sms")}
                  onCheckedChange={(checked) => handleChannelChange("sms", checked as boolean)}
                />
                <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  SMS
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Messages will be sent via WhatsApp first, with SMS as fallback
            </p>
          </div>

          {/* Message Content */}
          <div className="space-y-4">
            {formData.channels.includes("email") && (
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <Label htmlFor="message">Message Content *</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {sendResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Sent to {sendResult.sent} recipient{sendResult.sent !== 1 ? 's' : ''}.
                {sendResult.failed > 0 && ` ${sendResult.failed} failed.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Scheduling Options */}
          <div>
            <Label htmlFor="scheduleType">Send Options</Label>
            <Select 
              value={formData.scheduleType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Send Now</SelectItem>
                <SelectItem value="schedule">Schedule for Later</SelectItem>
                <SelectItem value="draft">Save as Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {formData.scheduleType === "draft" ? "Save Draft" : 
                 formData.scheduleType === "schedule" ? "Schedule" : "Send Now"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};