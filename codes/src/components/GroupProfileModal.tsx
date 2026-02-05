import { useState, useEffect } from "react";
import { X, Plus, Users, Calendar, MapPin, Phone, Mail, UserCheck, Eye, Search, Loader2, AlertCircle, Edit, Shield } from "lucide-react";
import { CreateGatheringModal } from "./CreateGatheringModal";
import { MemberAttendanceModal } from "./MemberAttendanceModal";
import { GroupGatheringAttendanceModal } from "./GroupGatheringAttendanceModal";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/config/api";

// Extend the Group interface to include assistantLeader and pastor details
interface Group {
  id: string;
  name: string;
  type: 'Department' | 'Ministry' | 'Committee' | 'Small Group' | 'General';
  description?: string;
  leader?: string;
  leaderContact?: string;
  members: string[];
  location?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  assistantLeader?: string;
  pastor?: string;
  classType?: string;
  sessionNumber?: string | number;
  assistantLeaderDetails?: {
    firstName: string;
    lastName: string;
  };
  pastorDetails?: {
    firstName: string;
    lastName: string;
  };
}

interface Member {
  memberID: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  status?: string;
}

interface Activity {
  id: string;
  name: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  status: 'Planned' | 'Completed' | 'Cancelled';
  attendanceCount?: number;
}

interface Gathering {
  gatheringID: string;
  gatheringName: string;
  gatheringType?: string;
  parentID: string;
  gatheringDate: string;
  gatheringTime?: string;
}

interface GroupProfileModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (group: Group) => void;
}

export const GroupProfileModal = ({ 
  group, 
  isOpen, 
  onClose,
  onEdit
}: GroupProfileModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activities'>('overview');
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [selectedMemberID, setSelectedMemberID] = useState<string>("");
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isActivityAttendanceModalOpen, setIsActivityAttendanceModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  
  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  
  // Leader state
  const [leaderName, setLeaderName] = useState<string>('');
  const [leaderContact, setLeaderContact] = useState<string>('');
  
  // Assistant Leader and Pastor details
  const [assistantLeaderName, setAssistantLeaderName] = useState<string>("");
  const [pastorName, setPastorName] = useState<string>("");

  const applyLeadershipNames = (source: any) => {
    const assistantLeader = source?.assistantLeaderDetails;
    const pastor = source?.pastorDetails;

    if (assistantLeader) {
      setAssistantLeaderName(`${assistantLeader.firstName} ${assistantLeader.lastName}`);
    } else {
      setAssistantLeaderName("");
    }

    if (pastor) {
      setPastorName(`${pastor.firstName} ${pastor.lastName}`);
    } else {
      setPastorName("");
    }
  };
  
  // Gatherings state
  const [gatherings, setGatherings] = useState<Activity[]>([]);
  const [isLoadingGatherings, setIsLoadingGatherings] = useState(false);
  const [gatheringsError, setGatheringsError] = useState<string | null>(null);

  // Fetch members when modal opens or group changes
  useEffect(() => {
    if (isOpen && group) {
      fetchMembers();
      fetchGatherings();
    }
  }, [isOpen, group]);

  // Set Assistant Leader and Pastor details when group data changes
  useEffect(() => {
    if (group) {
      applyLeadershipNames(group);
    }
  }, [group]);

  const fetchMembers = async () => {
    if (!group) return;
    
    setIsLoadingMembers(true);
    setMembersError(null);
    
    try {
      const response = await api.groups.getWithMembers(group.id.toString());
      const groupData = response.data || {};
      const membersData = groupData.members || [];
      
      // Transform members data
      const transformedMembers: Member[] = membersData.map((member: any) => ({
        memberID: member.memberID,
        firstName: member.firstName,
        lastName: member.lastName,
        phoneNumber: member.phoneNumber,
        email: member.email,
        status: member.status,
      }));
      
      setMembers(transformedMembers);
      
      // Set leader info from leaderDetails or find in members
      if (groupData.leaderDetails) {
        const leader = groupData.leaderDetails;
        setLeaderName(`${leader.firstName} ${leader.lastName}`);
        setLeaderContact(leader.phoneNumber || leader.email || '');
      } else if (group.leader) {
        const leader = membersData.find((m: any) => m.memberID === group.leader);
        if (leader) {
          setLeaderName(`${leader.firstName} ${leader.lastName}`);
          setLeaderContact(leader.phoneNumber || leader.email || '');
        }
      }

      applyLeadershipNames(groupData);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      setMembersError(error.message || 'Failed to load members');
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchGatherings = async () => {
    if (!group) return;
    
    setIsLoadingGatherings(true);
    setGatheringsError(null);
    
    try {
      const response = await api.gatherings.getByGroup(group.id.toString());
      const gatheringsData = response.data || [];
      
      // Transform gatherings and fetch attendance counts
      const transformedGatheringsPromises = gatheringsData.map(async (gathering: Gathering) => {
        let attendanceCount = 0;
        
        // Fetch attendance count for this gathering
        try {
          const attendanceResponse = await api.attendance.getByGathering(gathering.gatheringID);
          attendanceCount = attendanceResponse.total || attendanceResponse.attendance?.length || 0;
        } catch (error) {
          console.error(`Error fetching attendance for gathering ${gathering.gatheringID}:`, error);
        }

        const status: 'Planned' | 'Completed' | 'Cancelled' = new Date(gathering.gatheringDate) < new Date() ? 'Completed' : 'Planned';

        return {
          id: gathering.gatheringID,
          name: gathering.gatheringName,
          description: '',
          date: gathering.gatheringDate,
          time: gathering.gatheringTime || '',
          location: group.location || '',
          type: gathering.gatheringType || group.type,
          status,
          attendanceCount,
        };
      });
      
      const transformedGatherings: Activity[] = await Promise.all(transformedGatheringsPromises);
      
      // Sort by date (latest first)
      const sortedGatherings = transformedGatherings.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (latest first)
      });
      
      setGatherings(sortedGatherings);
    } catch (error: any) {
      console.error('Error fetching gatherings:', error);
      setGatheringsError(error.message || 'Failed to load gatherings');
      toast({
        title: "Error",
        description: "Failed to load gatherings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGatherings(false);
    }
  };

  const handleGatheringSaved = () => {
    // Refresh gatherings list after creating a new one
    fetchGatherings();
  };

  if (!group) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Department': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Ministry': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Committee': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Small Group': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold">{group.name}</DialogTitle>
                <DialogDescription className="sr-only">
                  View and manage group details, members, and gatherings
                </DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getTypeColor(group.type)}>
                    {group.type}
                  </Badge>
                  <Badge className={getStatusColor(group.status)}>
                    {group.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreateActivityOpen(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Gathering
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

        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'members', label: 'Members', icon: UserCheck },
            { id: 'activities', label: 'Gatherings', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6 py-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Group Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.description && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">DESCRIPTION</h4>
                      <p className="text-foreground">{group.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">CREATED DATE</h4>
                      <p className="text-foreground">
                        {new Date(group.createdDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">TOTAL MEMBERS</h4>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                          {isLoadingMembers ? '...' : members.length}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">CLASS TYPE</h4>
                      <p className="text-foreground">{group.classType || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">SESSION NUMBER</h4>
                      <p className="text-foreground">
                        {group.sessionNumber !== undefined && group.sessionNumber !== ''
                          ? group.sessionNumber
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leadership Information */}
                  {group.leader && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Leadership</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingMembers ? (
                          <div className="flex items-start gap-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {leaderName || group.leader}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {leaderContact || 'No contact'}
                                </p>
                              </div>
                            </div>
                            {assistantLeaderName && (
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">Assistant Leader</h4>
                                  <p className="text-sm text-muted-foreground">{assistantLeaderName}</p>
                                </div>
                              </div>
                            )}
                            {pastorName && (
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">Pastor</h4>
                                  <p className="text-sm text-muted-foreground">{pastorName}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

              {/* Location */}
              {group.location && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Meeting Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{group.location}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Group Members ({members.filter(member =>
                      `${member.firstName} ${member.lastName}`.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                      member.email?.toLowerCase().includes(memberSearchTerm.toLowerCase())
                    ).length})
                  </CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : membersError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{membersError}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {members && members.length > 0 ? (
                      <>
                        {members
                          .filter(member => {
                            if (!member?.firstName && !member?.lastName) return false;
                            return `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                              member.email?.toLowerCase().includes(memberSearchTerm.toLowerCase());
                          })
                          .map((member) => {
                            const firstName = member.firstName || 'Unknown';
                            const lastName = member.lastName || '';
                            return (
                              <div key={member.memberID} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">
                                      {firstName[0]}{lastName ? lastName[0] : ''}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">
                                      {firstName} {lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {member.email || member.phoneNumber || 'Member'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMemberID(member.memberID);
                                    setSelectedMemberName(`${firstName} ${lastName}`);
                                    setIsAttendanceModalOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Attendance
                                </Button>
                              </div>
                            );
                          })}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No members in this group</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Gatherings</CardTitle>
              </CardHeader>
              <CardContent>
                {gatheringsError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{gatheringsError}</AlertDescription>
                  </Alert>
                )}
                
                {isLoadingGatherings ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gatherings.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{activity.name}</h4>
                          <Badge variant="outline">{activity.type}</Badge>
                          <Badge className={
                            activity.status === 'Completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : activity.status === 'Planned'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }>
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(`2024-01-01T${activity.time}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {activity.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {activity.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {activity.attendanceCount || 0} {activity.attendanceCount === 1 ? 'attendee' : 'attendees'}
                          </div>
                        </div>
                      </div>
                      {activity.status === 'Completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setIsActivityAttendanceModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Attendance
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {gatherings.length === 0 && !isLoadingGatherings && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No gatherings recorded yet</p>
                      <p className="text-sm">Create your first gathering to get started</p>
                    </div>
                  )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Modals */}
    {group && (
      <>
        <CreateGatheringModal
          groupID={group.id.toString()}
          groupName={group.name}
          groupType={group.type}
          isOpen={isCreateActivityOpen}
          onClose={() => setIsCreateActivityOpen(false)}
          onSave={handleGatheringSaved}
        />

        <MemberAttendanceModal
          memberID={selectedMemberID}
          memberName={selectedMemberName}
          groupID={group.id}
          groupName={group.name} // Added groupName to resolve the error
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setSelectedMemberID("");
            setSelectedMemberName("");
          }}
        />

        <GroupGatheringAttendanceModal
          isOpen={isActivityAttendanceModalOpen}
          onClose={() => {
            setIsActivityAttendanceModalOpen(false);
            setSelectedActivity(null);
          }}
          group={group}
          activity={selectedActivity}
        />
      </>
    )}
    </>
  );
};