import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

interface Member {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  lastAttended: string;
}

interface Guest {
  guestID: string;
  name: string;
  phone: string;
  email: string;
}

interface Attendee {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  type: 'member' | 'guest';
}

interface SendFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  absentMembers?: Member[];
  attendees?: Attendee[];
  guests?: Guest[];
  eventName: string;
}

export function SendFollowUpModal({ isOpen, onClose, absentMembers = [], attendees = [], guests = [], eventName }: SendFollowUpModalProps) {
  const [recipientType, setRecipientType] = useState<'absent' | 'attendees' | 'guests'>('absent');
  const [message, setMessage] = useState(`Hi [Name],\n\nWe missed you at ${eventName}. We hope you're doing well and look forward to seeing you soon.\n\nBlessings,\nTCC Team`);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Update selected recipients when recipient type or data changes
  useEffect(() => {
    if (recipientType === 'absent') {
      setSelectedMembers(absentMembers.map(m => String(m.id)));
    } else if (recipientType === 'attendees') {
      setSelectedMembers(attendees.map(a => String(a.id)));
    } else {
      setSelectedMembers(guests.map(g => g.guestID));
    }
  }, [recipientType, absentMembers, attendees, guests]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      // Prepare recipients with personalized messages
      const recipientsList = selectedMembers.map(id => {
        let recipient: any = null;
        let name = '';
        let phone = '';
        let email = '';

        if (recipientType === 'absent') {
          recipient = absentMembers.find(m => String(m.id) === id);
          name = recipient?.name || '';
          phone = recipient?.phone || '';
          email = recipient?.email || '';
        } else if (recipientType === 'attendees') {
          recipient = attendees.find(a => String(a.id) === id);
          name = recipient?.name || '';
          phone = recipient?.phone || '';
          email = recipient?.email || '';
        } else {
          recipient = guests.find(g => g.guestID === id);
          name = recipient?.name || '';
          phone = recipient?.phone || '';
          email = recipient?.email || '';
        }

        // Personalize message by replacing [Name] with actual name
        const personalizedMessage = message.replace(/\[Name\]/g, name);

        return {
          id,
          name,
          phone,
          email,
          message: personalizedMessage
        };
      });

      // Send via communications API with WhatsApp-first, SMS fallback
      await api.communications.send({
        channel: 'whatsapp', // Try WhatsApp first
        smsChannelFallback: true, // Enable SMS fallback
        recipientType: 'custom',
        recipients: recipientsList,
        message: message, // Template message
        personalizedMessages: recipientsList.map(r => ({
          id: r.id,
          message: r.message,
          phone: r.phone
        })),
        context: 'follow-up',
        eventName: eventName
      });

      toast({
        title: "Follow-up Messages Sent",
        description: `Successfully sent messages to ${selectedMembers.length} recipient${selectedMembers.length !== 1 ? 's' : ''} via WhatsApp/SMS`,
      });
      onClose();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send follow-up messages",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id)
        ? prev.filter(recipientId => recipientId !== id)
        : [...prev, id]
    );
  };

  const currentRecipients = recipientType === 'absent' ? absentMembers : recipientType === 'attendees' ? attendees : guests;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Follow-up Messages
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recipient Type Selection */}
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={recipientType} onValueChange={(value: 'absent' | 'attendees' | 'guests') => setRecipientType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absent">Absent Members ({absentMembers.length})</SelectItem>
                <SelectItem value="attendees">Attendees ({attendees.length})</SelectItem>
                <SelectItem value="guests">Guests ({guests.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">
                Select Recipients ({selectedMembers.length} of {currentRecipients.length})
              </h3>
            </div>
            <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {recipientType === 'absent' ? (
                  absentMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(String(member.id))}
                        onChange={() => toggleRecipient(String(member.id))}
                        className="rounded"
                      />
                      <span className="flex-1">{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Last: {member.lastAttended}
                      </Badge>
                    </label>
                  ))
                ) : recipientType === 'attendees' ? (
                  attendees.map((attendee) => (
                    <label
                      key={attendee.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(String(attendee.id))}
                        onChange={() => toggleRecipient(String(attendee.id))}
                        className="rounded"
                      />
                      <span className="flex-1">{attendee.name}</span>
                      <Badge variant="default" className="text-xs">
                        {attendee.type === 'member' ? 'Member' : 'Guest'}
                      </Badge>
                    </label>
                  ))
                ) : (
                  guests.map((guest) => (
                    <label
                      key={guest.guestID}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(guest.guestID)}
                        onChange={() => toggleRecipient(guest.guestID)}
                        className="rounded"
                      />
                      <span className="flex-1">{guest.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        Guest
                      </Badge>
                    </label>
                  ))
                )}
                {currentRecipients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No {recipientType === 'absent' ? 'absent members' : recipientType === 'attendees' ? 'attendees' : 'guests'} to show
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Message Section */}
          <div>
            <h3 className="font-medium mb-3">Message Content</h3>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Enter your follow-up message..."
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Use [Name] to personalize the message for each recipient
            </p>
          </div>

          {/* Communication Channels */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Communication Channels</h4>
            <p className="text-sm text-muted-foreground">
              Messages will be sent via WhatsApp first, with SMS fallback for unavailable numbers
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={selectedMembers.length === 0 || !message.trim() || isSending}
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}