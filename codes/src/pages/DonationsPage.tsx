import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VerifyDonationModal } from "@/components/VerifyDonationModal";
import { AddEditMemberModal } from "@/components/AddEditMemberModal";
import { useToast } from "@/hooks/use-toast";

const DonationsPage = () => {
  const { toast } = useToast();
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [guestMemberData, setGuestMemberData] = useState(null);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [isVerifyingDonation, setIsVerifyingDonation] = useState(false);
  const [donationsError, setDonationsError] = useState(null);

  const fetchPendingDonations = async () => {
    setIsLoadingDonations(true);
    setDonationsError(null);
    try {
      const data = await api.donations.getAll(new URLSearchParams({ status: 'pending' }));
      console.log('Donations data received:', data);
      console.log('Is donations data array?', Array.isArray(data));
      setPendingDonations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending donations:', error);
      setDonationsError(error.message || 'Failed to load pending donations');
    } finally {
      setIsLoadingDonations(false);
    }
  };

  useEffect(() => {
    fetchPendingDonations();
  }, []);

  const handleVerifyDonation = (donation) => {
    setSelectedDonation(donation);
    setIsVerifyModalOpen(true);
  };

  const handleVerifyComplete = async (donationId, action) => {
    setIsVerifyingDonation(true);
    try {
      if (action === 'verify') {
        await api.donations.verify(donationId, {});
        toast({
          title: "Donation Verified",
          description: "The donation has been successfully verified",
        });
      } else if (action === 'update') {
        await api.donations.update(donationId, {});
        toast({
          title: "Donation Updated",
          description: "The donation has been successfully updated",
        });
      }
      setPendingDonations(prev => prev.filter(d => d.id !== donationId));
    } catch (error) {
      console.error('Error verifying donation:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify the donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingDonation(false);
    }
  };

  const handleCreateMemberFromGuest = (guestInfo) => {
    setGuestMemberData({
      name: guestInfo.name,
      email: guestInfo.email,
      phone: guestInfo.phone,
      status: "Active",
      joinDate: new Date().toISOString().split('T')[0],
      family: guestInfo.name.split(' ').slice(-1)[0] + " Family",
      membershipType: "Regular Member"
    });
    setIsAddMemberModalOpen(true);
  };

  const handleSaveGuestMember = (memberData) => {
    // Here you would typically save the member and link the donation
    toast({
      title: "Member created successfully",
      description: `${memberData.name} has been added as a new member and linked to their donation.`,
    });
    setIsAddMemberModalOpen(false);
    setGuestMemberData(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Donations</h1>
            <p className="text-muted-foreground">Manage and verify donation submissions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verification</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDonations ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{pendingDonations.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month Total</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDonations ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">$12,450</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDonations ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">$3,200</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Today</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDonations ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-2xl font-bold text-foreground">8</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Donations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Pending Donations Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead className="hidden md:table-cell">Amount</TableHead>
                    <TableHead className="hidden lg:table-cell">Fund</TableHead>
                    <TableHead className="hidden xl:table-cell">Date</TableHead>
                    <TableHead>Member Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDonations ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : donationsError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Alert variant="destructive" className="max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Donations Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between">
                            <span>{donationsError}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchPendingDonations}
                              disabled={isLoadingDonations}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : pendingDonations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No pending donations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingDonations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="font-medium">{donation.donorName}</TableCell>
                        <TableCell className="hidden md:table-cell font-semibold">{donation.amount}</TableCell>
                        <TableCell className="hidden lg:table-cell">{donation.fund}</TableCell>
                        <TableCell className="hidden xl:table-cell">{donation.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={donation.isKnownMember ? 'default' : 'secondary'}
                            className={donation.isKnownMember ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200'}
                          >
                            {donation.isKnownMember ? 'Known Member' : 'Guest'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{donation.submittedAt}</TableCell>
                         <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => handleVerifyDonation(donation)}
                            disabled={isVerifyingDonation}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <VerifyDonationModal
        donation={selectedDonation}
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerify={handleVerifyComplete}
        onCreateMember={handleCreateMemberFromGuest}
      />

      <AddEditMemberModal
        member={guestMemberData}
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSave={handleSaveGuestMember}
        isEdit={false}
      />
    </DashboardLayout>
  );
};

export default DonationsPage;