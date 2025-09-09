import { useState } from "react";
import { X, Edit, Users, Calendar, DollarSign, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  joinDate: string;
  family: string;
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  membershipType?: string;
}

interface MemberProfileModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
}

export const MemberProfileModal = ({ member, isOpen, onClose, onEdit }: MemberProfileModalProps) => {
  if (!member) return null;

  const mockAttendance = [
    { date: "2024-01-07", event: "Sunday Service", status: "Present" },
    { date: "2024-01-03", event: "Bible Study", status: "Present" },
    { date: "2023-12-31", event: "Sunday Service", status: "Absent" },
  ];

  const mockDonations = [
    { date: "2024-01-01", amount: "$250.00", fund: "General Fund" },
    { date: "2023-12-15", amount: "$100.00", fund: "Building Fund" },
    { date: "2023-11-20", amount: "$500.00", fund: "Missions" },
  ];

  const mockGroups = [
    { name: "Youth Fellowship", role: "Member", joinDate: "2023-06-15" },
    { name: "Worship Team", role: "Vocalist", joinDate: "2023-08-01" },
  ];

  const mockFamily = [
    { name: "Jane Smith", relationship: "Spouse", status: "Active" },
    { name: "Michael Smith", relationship: "Son", status: "Active" },
    { name: "Sarah Smith", relationship: "Daughter", status: "Active" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold">{member.name}</DialogTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(member)}
              className="gap-2"
              size="sm"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{member.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-sm">{member.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                <p className="text-sm">{member.joinDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Family</label>
                <p className="text-sm">{member.family}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Membership Type</label>
                <p className="text-sm">{member.membershipType || 'Regular Member'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="family" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="family" className="gap-2">
                <Users className="h-4 w-4" />
                Family
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="donations" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Donations
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Calendar className="h-4 w-4" />
                Groups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="family" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Family Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockFamily.map((familyMember, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{familyMember.name}</p>
                          <p className="text-sm text-muted-foreground">{familyMember.relationship}</p>
                        </div>
                        <Badge variant={familyMember.status === 'Active' ? 'default' : 'secondary'}>
                          {familyMember.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAttendance.map((record, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{record.event}</p>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                        <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Donation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockDonations.map((donation, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{donation.amount}</p>
                          <p className="text-sm text-muted-foreground">{donation.fund} • {donation.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Group Memberships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockGroups.map((group, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.role} • Joined {group.joinDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};