import { useState } from "react";
import { X, User, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PendingDonation {
  id: number;
  donorName: string;
  email: string;
  phone: string;
  amount: string;
  fund: string;
  date: string;
  submittedAt: string;
  isKnownMember: boolean;
  memberDetails?: {
    id: number;
    name: string;
    status: string;
    joinDate: string;
  };
}

interface VerifyDonationModalProps {
  donation: PendingDonation | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (donationId: number, action: 'verify' | 'create-member') => void;
  onCreateMember: (guestInfo: { name: string; email: string; phone: string }) => void;
}

export const VerifyDonationModal = ({ 
  donation, 
  isOpen, 
  onClose, 
  onVerify,
  onCreateMember 
}: VerifyDonationModalProps) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  if (!donation) return null;

  const handleVerifyDonation = async () => {
    setIsVerifying(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onVerify(donation.id, 'verify');
      
      toast({
        title: "Donation verified successfully",
        description: `${donation.donorName}'s donation of ${donation.amount} has been recorded.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateMemberProfile = () => {
    onCreateMember({
      name: donation.donorName,
      email: donation.email,
      phone: donation.phone
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold">Verify Donation</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 pb-20 sm:pb-4">
          {/* Donation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Donation Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-lg font-semibold text-primary">{donation.amount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fund</label>
                <p className="text-sm">{donation.fund}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Donation Date</label>
                <p className="text-sm">{donation.date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                <p className="text-sm">{donation.submittedAt}</p>
              </div>
            </CardContent>
          </Card>

          {/* Donor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Donor Information
                <Badge 
                  variant={donation.isKnownMember ? "default" : "secondary"}
                  className="ml-auto"
                >
                  {donation.isKnownMember ? "Known Member" : "Guest Donor"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm font-medium">{donation.donorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{donation.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{donation.phone}</p>
                </div>
              </div>

              {donation.isKnownMember && donation.memberDetails && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Member Profile</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Member ID:</span> #{donation.memberDetails.id}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span> 
                      <Badge variant="outline" className="ml-1 text-xs">
                        {donation.memberDetails.status}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Join Date:</span> {donation.memberDetails.joinDate}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t sm:relative sm:bg-transparent sm:border-t-0 sm:p-0 sm:pt-4">
            <div className="flex flex-col sm:flex-row justify-end gap-3 max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isVerifying}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            
            {!donation.isKnownMember && (
              <Button
                variant="secondary"
                onClick={handleCreateMemberProfile}
                disabled={isVerifying}
                className="gap-2 w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                Create Member Profile
              </Button>
            )}
            
            <Button
              onClick={handleVerifyDonation}
              disabled={isVerifying}
              className="gap-2 w-full sm:w-auto"
            >
              <User className="h-4 w-4" />
              {isVerifying ? 'Verifying...' : 'Verify & Record Donation'}
            </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};