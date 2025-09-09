import { useState } from "react";
import { X, Plus, Users, Calendar, MapPin, Phone, Mail, UserCheck, Eye, Search } from "lucide-react";
import { CreateActivityModal } from "./CreateActivityModal";
import { MemberAttendanceModal } from "./MemberAttendanceModal";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Group {
  id: number;
  name: string;
  type: 'Department' | 'Ministry' | 'Committee' | 'Small Group';
  description?: string;
  leader?: string;
  leaderContact?: string;
  members: string[];
  location?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

interface Activity {
  id: number;
  name: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  status: 'Planned' | 'Completed' | 'Cancelled';
  attendanceCount?: number;
}

interface GroupProfileModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupProfileModal = ({ 
  group, 
  isOpen, 
  onClose
}: GroupProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activities'>('overview');
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  
  // Mock activities data
  const [activities] = useState<Activity[]>([
    {
      id: 1,
      name: "Sunday Service",
      description: "Weekly worship service",
      date: "2024-08-25",
      time: "10:00",
      location: "Main Sanctuary",
      type: "Worship",
      status: "Completed",
      attendanceCount: 45
    },
    {
      id: 2,
      name: "Bible Study",
      description: "Weekly Bible study session",
      date: "2024-08-22",
      time: "19:00",
      location: "Conference Room",
      type: "Study",
      status: "Completed",
      attendanceCount: 32
    },
    {
      id: 3,
      name: "Youth Fellowship",
      description: "Monthly youth gathering",
      date: "2024-09-01",
      time: "15:00",
      location: "Youth Hall",
      type: "Fellowship",
      status: "Planned",
      attendanceCount: 0
    }
  ]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <div>
              <DialogTitle className="text-2xl font-bold">{group.name}</DialogTitle>
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
              Create Activity
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
            { id: 'activities', label: 'Activities', icon: Calendar }
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
                        <span className="text-foreground font-medium">{group.members.length}</span>
                      </div>
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
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{group.leader}</h4>
                        <p className="text-sm text-muted-foreground mb-2">Group Leader</p>
                        {group.leaderContact && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {group.leaderContact}
                          </div>
                        )}
                      </div>
                    </div>
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
                  <CardTitle className="text-lg">Group Members ({group.members.filter(member =>
                    member.toLowerCase().includes(memberSearchTerm.toLowerCase())
                  ).length})</CardTitle>
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {group.members
                    .filter(member => member.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                    .map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{member}</p>
                          <p className="text-sm text-muted-foreground">Member</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMemberName(member);
                          setIsAttendanceModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Attendance
                      </Button>
                    </div>
                  ))}
                  {group.members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No members added yet</p>
                    </div>
                  )}
                  {group.members.length > 0 && group.members.filter(member =>
                    member.toLowerCase().includes(memberSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No members found</p>
                      <p className="text-sm">Try adjusting your search terms</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
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
                          {activity.status === 'Completed' && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {activity.attendanceCount} attended
                            </div>
                          )}
                        </div>
                      </div>
                      {activity.status === 'Completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Attendance
                        </Button>
                      )}
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No activities recorded yet</p>
                      <p className="text-sm">Create your first activity to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modals */}
        {group && (
          <>
            <CreateActivityModal
              groupId={group.id}
              groupName={group.name}
              isOpen={isCreateActivityOpen}
              onClose={() => setIsCreateActivityOpen(false)}
              onSave={(activity) => {
                console.log("Activity created:", activity);
                setIsCreateActivityOpen(false);
              }}
            />

            <MemberAttendanceModal
              memberName={selectedMemberName}
              groupName={group.name}
              isOpen={isAttendanceModalOpen}
              onClose={() => {
                setIsAttendanceModalOpen(false);
                setSelectedMemberName("");
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};