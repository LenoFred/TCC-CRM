import { useState } from "react";
import { CheckCircle, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  
  // Mock pending donations data
  const [pendingDonations, setPendingDonations] = useState([
    {
      id: 1,
      donorName: "John Smith",
      email: "john.smith@email.com",
      phone: "+1 234-567-8901",
      amount: "$250.00",
      fund: "General Fund",
      date: "2024-08-30",
      submittedAt: "2024-08-30 10:30 AM",
      isKnownMember: true,
      memberDetails: {
        id: 123,
        name: "John Smith",
        status: "Active",
        joinDate: "2022-01-15"
      }
    },
    {
      id: 2,
      donorName: "Sarah Williams",
      email: "sarah.williams@email.com",
      phone: "+1 555-123-4567",
      amount: "$100.00",
      fund: "Mission Fund",
      date: "2024-08-30",
      submittedAt: "2024-08-30 09:15 AM",
      isKnownMember: false
    },
    {
      id: 3,
      donorName: "Michael Brown",
      email: "michael.brown@email.com",
      phone: "+1 555-987-6543",
      amount: "$500.00",
      fund: "Building Fund",
      date: "2024-08-29",
      submittedAt: "2024-08-29 6:45 PM",
      isKnownMember: false
    }
  ]);

  const handleVerifyDonation = (donation) => {
    setSelectedDonation(donation);
    setIsVerifyModalOpen(true);
  };

  const handleVerifyComplete = (donationId, action) => {
    setPendingDonations(prev => prev.filter(d => d.id !== donationId));
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
              <div className="text-2xl font-bold text-foreground">{pendingDonations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$12,450</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$3,200</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">8</div>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Member Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.donorName}</TableCell>
                      <TableCell className="font-semibold">{donation.amount}</TableCell>
                      <TableCell>{donation.fund}</TableCell>
                      <TableCell>{donation.date}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={donation.isKnownMember ? 'default' : 'secondary'}
                          className={donation.isKnownMember ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200'}
                        >
                          {donation.isKnownMember ? 'Known Member' : 'Guest'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{donation.submittedAt}</TableCell>
                       <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleVerifyDonation(donation)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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