import { useState, useEffect } from "react";
import { X, Edit, Users, Calendar, DollarSign, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string | number;
  memberID?: string; // Backend ID field
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  phoneNumber?: string; // Backend field
  status: string;
  memberStatus?: string; // Backend field
  joinDate: string;
  family: string;
  familyID?: string; // Backend field
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  dOB?: string; // Backend field
  gender?: string;
  state?: string;
  lga?: string;
  lGA?: string; // Backend field
  membershipType?: string;
  memberType?: string; // Backend field
  CLDS?: string;
  Baptism?: string;
  GBIC?: string;
  ABIC?: string;
  membershipLevel?: string;
}

interface MemberProfileModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
}

export const MemberProfileModal = ({ member, isOpen, onClose, onEdit }: MemberProfileModalProps) => {
  const { toast } = useToast();
  const { canEdit } = usePermission();
  const [attendance, setAttendance] = useState([]);
  const [donations, setDonations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [family, setFamily] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);

  const fetchMemberData = async () => {
    if (!member) {
      console.log('No member provided to fetchMemberData');
      return;
    }

    setIsLoadingData(true);
    setDataError(null);
    try {
      // Use memberID from backend
      const memberId = member.memberID || member.id;
      console.log('Fetching member data for:', { member, memberId });
      
      // Guard against undefined memberId
      if (!memberId) {
        console.error('Member ID is undefined:', member);
        setDataError('Invalid member ID');
        setIsLoadingData(false);
        return;
      }
      
      // Don't fetch member details from API - we already have it from the list
      // The member prop contains all the data we need
      const memberData = member;
      
      // Fetch attendance records for this member
      try {
        const attendanceResponse: any = await api.attendance.getByMember(String(memberId));
        console.log('Attendance data:', attendanceResponse);
        // API returns { memberID, total, attendance: [...] }
        const attendanceData = attendanceResponse.attendance || [];
        setAttendance(attendanceData);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendance([]);
      }
      
      // Fetch donations for this member
      try {
        const donationsResponse: any = await api.donations.getByMember(String(memberId));
        console.log('Donations data:', donationsResponse);
        // API returns { memberID, total, totalAmount, donations: [...] }
        const donationsData = donationsResponse.donations || [];
        setDonations(donationsData);
      } catch (error) {
        console.error('Error fetching donations:', error);
        setDonations([]);
      }
      
      // Fetch family members if member has a familyID
      try {
        if (memberData.familyID && memberData.familyID.trim() !== '') {
          const familyID = memberData.familyID;
          const familyResponse: any = await api.members.getAll();
          const allMembers = familyResponse.data || [];
          const familyMembers = allMembers.filter((m: any) => 
            m.familyID === familyID && m.memberID !== memberId
          );
          console.log('Family members:', familyMembers);
          setFamily(familyMembers.map((m: any) => ({
            name: `${m.firstName} ${m.lastName}`,
            relationship: 'Family Member',
            status: m.memberStatus
          })));
        } else {
          setFamily([]);
        }
      } catch (error) {
        console.error('Error fetching family members:', error);
        setFamily([]);
      }
      
            // Fetch groups - backend already joins GroupMembers with Groups data
      try {
        const groupMembersResponse: any = await api.groupMembers.getByMember(String(memberId));
        const groupMembershipsData = groupMembersResponse.groups || [];
        
        // Transform the data - no need for extra API calls, backend provides group details
        const groupsData = groupMembershipsData.map((membership: any) => ({
          name: membership.group?.groupName || 'Unknown Group',
          type: membership.group?.groupType || 'N/A',
          role: membership.role || 'Member',
          joinDate: membership.joinedDate ? new Date(membership.joinedDate).toLocaleDateString() : 'N/A',
          status: membership.status || 'Active'
        }));
        
        setGroups(groupsData);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    } catch (error: any) {
      console.error('Error fetching member data:', error);
      setDataError(error.message || 'Failed to load member data');
      toast({
        title: "Error",
        description: "Failed to load member data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (member && isOpen) {
      fetchMemberData();
    }
  }, [member, isOpen]);

  const normalizeStatus = (value?: string, doneLabel?: string) => {
    const val = (value || '').toString().trim();
    if (!val) return doneLabel ? 'Not Done' : 'Not Completed';
    const lower = val.toLowerCase();
    if (doneLabel) {
      return lower === 'done' ? 'Done' : 'Not Done';
    }
    return lower === 'completed' ? 'Completed' : 'Not Completed';
  };

  if (!member) return null;

  const normalizedMembershipLevel = (() => {
    const val = (member.membershipLevel || '').toString().trim().toLowerCase();
    if (val === 'registered member') return 'registered member';
    return 'member';
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="member-profile-description" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold">{member.name}</DialogTitle>
          <div className="flex gap-2">
            {canEdit('members') && (
              <Button
                onClick={() => onEdit(member)}
                className="gap-2"
                size="sm"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <DialogDescription id="member-profile-description">
          View and manage the details of the selected member.
        </DialogDescription>

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
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="text-sm">
                  {(member.dateOfBirth || member.dOB) ? (() => {
                    const d = new Date(member.dateOfBirth || member.dOB);
                    return isNaN(d.getTime()) ? 'Not provided' : d.toISOString().slice(0, 10);
                  })() : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="text-sm">{member.gender || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <p className="text-sm">{member.state || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">LGA</label>
                <p className="text-sm">{member.lga || member.lGA || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Membership Type</label>
                <p className="text-sm">{member.membershipType || member.memberType || 'Regular Member'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm">{member.address || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                <p className="text-sm">{member.emergencyContact || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="family" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="onboarding" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Onboarding
              </TabsTrigger>
            </TabsList>
            <TabsContent value="onboarding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Onboarding & Discipleship Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Baptismal Class (Compulsory)</p>
                      <span className="block mt-1">Baptismal Class: <Badge variant={normalizeStatus(member.Baptism, 'done') === 'Done' ? 'default' : 'secondary'}>{normalizeStatus(member.Baptism, 'done')}</Badge></span>
                    </div>
                    <div>
                      <p className="font-semibold">CLDS (Christian Life Development School) (Compulsory)</p>
                      <span className="block mt-1">CLDS: <Badge variant={normalizeStatus(member.CLDS) === 'Completed' ? 'default' : 'secondary'}>{normalizeStatus(member.CLDS)}</Badge></span>
                    </div>
                    <div>
                      <p className="font-semibold">GBIC (Optional)</p>
                      <span className="block mt-1">GBIC: <Badge variant={normalizeStatus(member.GBIC) === 'Completed' ? 'default' : 'secondary'}>{normalizeStatus(member.GBIC)}</Badge></span>
                    </div>
                    <div>
                      <p className="font-semibold">ABIC (Optional)</p>
                      <span className="block mt-1">ABIC: <Badge variant={normalizeStatus(member.ABIC) === 'Completed' ? 'default' : 'secondary'}>{normalizeStatus(member.ABIC)}</Badge></span>
                    </div>
                    <div>
                      <p className="font-semibold">Membership Level</p>
                      <span className="block mt-1">Level: <Badge variant={normalizedMembershipLevel === 'registered member' ? 'default' : 'secondary'}>{normalizedMembershipLevel}</Badge></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="family" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Family Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : dataError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Family Data Error</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{dataError}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchMemberData}
                          disabled={isLoadingData}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : family.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No family members found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {family.map((familyMember, index) => (
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : dataError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Attendance Data Error</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{dataError}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchMemberData}
                          disabled={isLoadingData}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : attendance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No attendance records found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendance.map((record: any, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {record.gathering?.gatheringName || `Gathering: ${record.gatheringID || 'N/A'}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {record.checkInTime ? new Date(record.checkInTime).toLocaleDateString() : 
                                record.gathering?.gatheringDate ? new Date(record.gathering.gatheringDate).toLocaleDateString() : 'No date'} 
                              {record.checkInTime ? ` at ${new Date(record.checkInTime).toLocaleTimeString()}` : 
                                record.gathering?.gatheringTime ? ` at ${record.gathering.gatheringTime}` : ''}
                            </p>
                            {record.checkInMethod && (
                              <p className="text-xs text-muted-foreground mt-1">Method: {record.checkInMethod}</p>
                            )}
                            {record.gathering?.gatheringType && (
                              <p className="text-xs text-muted-foreground">Type: {record.gathering.gatheringType}</p>
                            )}
                          </div>
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            {record.status || 'Present'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Donation History</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dataError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Donations Data Error</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{dataError}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchMemberData}
                          disabled={isLoadingData}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : donations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No donation records found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {donations.map((donation: any, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {donation.currency ? `${donation.currency} ` : ''}
                              {donation.amount || 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {donation.fund || donation.donationType || 'General'} 
                              {donation.paymentMethod && ` • ${donation.paymentMethod}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : 'No date'}
                            </p>
                            {donation.notes && (
                              <p className="text-xs text-muted-foreground italic mt-1">{donation.notes}</p>
                            )}
                          </div>
                          <Badge variant={donation.verificationStatus === 'Verified' ? 'default' : 'secondary'}>
                            {donation.verificationStatus || 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Group Memberships</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dataError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Groups Data Error</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{dataError}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchMemberData}
                          disabled={isLoadingData}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No group memberships found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groups.map((group: any, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {group.type} • {group.role} • Joined {group.joinDate}
                            </p>
                          </div>
                          <Badge variant={group.status?.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                            {group.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};