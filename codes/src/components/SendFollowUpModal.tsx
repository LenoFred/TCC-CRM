import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  name: string;
  lastAttended: string;
}

interface SendFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  absentMembers: Member[];
  eventName: string;
}

export function SendFollowUpModal({ isOpen, onClose, absentMembers, eventName }: SendFollowUpModalProps) {
  const [message, setMessage] = useState(`Hi [Name],\n\nWe missed you at ${eventName}. We hope you're doing well and look forward to seeing you soon.\n\nBlessings,\nTCC Team`);
  const [selectedMembers, setSelectedMembers] = useState<number[]>(absentMembers.map(m => m.id));
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    setIsSending(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Follow-up Messages Sent",
        description: `Successfully sent messages to ${selectedMembers.length} members`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send follow-up messages",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

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
          {/* Recipients Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">Recipients ({selectedMembers.length})</h3>
            </div>
            <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {absentMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="rounded"
                    />
                    <span className="flex-1">{member.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Last: {member.lastAttended}
                    </Badge>
                  </label>
                ))}
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