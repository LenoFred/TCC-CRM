import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGuests, useDonationVerification } from "@/hooks/useBusinessLogic";
import { dashboardService } from "@/services/businessLogicService";
import api from "@/config/api";
import { cacheInvalidationService } from "@/utils/cacheInvalidation";
import {
  Users,
  Heart,
  Calendar,
  UserCheck,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
  UserPlus,
  CheckCircle,
  DollarSign,
  UsersRound,
  Home,
  Activity,
  Loader2,
  Search
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const typedUser = (user as unknown as { staffRole?: string; fullName?: string; firstName?: string; role?: string }) || {};
  const staffRole = typedUser.staffRole || typedUser.role || 'Staff';
  const displayName = typedUser.fullName || typedUser.firstName || 'User';
  
  // Use business logic hooks
  const { fetchGuests, fetchStats, guests, stats, loading: guestsLoading, error: guestsError } = useGuests();
  const { 
    fetchPendingDonations, 
    fetchStats: fetchDonationStats, 
    pendingDonations, 
    stats: donationStats, 
    loading: donationsLoading, 
    error: donationsError 
  } = useDonationVerification();
  
  // New state for dashboard stats
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingAllActivities, setIsLoadingAllActivities] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [isIngestingForms, setIsIngestingForms] = useState(false);

  // Calculate if loading
  const isLoadingMetrics = guestsLoading || donationsLoading || isLoadingDashboard;
  const metricsError = guestsError || donationsError || dashboardError;

  const fetchDashboardData = async () => {
    try {
      // Fetch guest statistics
      await fetchGuests(false);
      await fetchStats(30); // Last 30 days
      
      // Fetch donation statistics
      await fetchPendingDonations();
      await fetchDonationStats();
      
      // Fetch dashboard stats (members, families, groups, events)
      setIsLoadingDashboard(true);
      setDashboardError(null);
      const dashStats = await dashboardService.getDashboardStats();
      if (dashStats.success) {
        setDashboardStats(dashStats.data);
        setUpcomingEvents(dashStats.data.upcomingEvents || []);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setDashboardError(error.message || 'Failed to load dashboard');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setIsLoadingActivities(true);
      setActivitiesError(null);
      const response: any = await dashboardService.getRecentActivities(10);
      if (response.success) {
        setRecentActivity(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      setActivitiesError(error.message || 'Failed to load activities');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const fetchAllActivities = async () => {
    try {
      setIsLoadingAllActivities(true);
      const response: any = await dashboardService.getRecentActivities(1000); // Fetch up to 1000 activities
      if (response.success) {
        setAllActivities(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching all activities:', error);
      toast({
        title: "Error",
        description: "Failed to load all activities",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAllActivities(false);
    }
  };

  const handleLoadMore = async () => {
    setShowActivitiesModal(true);
    if (allActivities.length === 0) {
      await fetchAllActivities();
    }
  };

  const filteredActivities = allActivities.filter(activity => {
    const searchLower = activitySearchQuery.toLowerCase();
    return (
      activity.type?.toLowerCase().includes(searchLower) ||
      activity.description?.toLowerCase().includes(searchLower) ||
      activity.memberName?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    
    // Auto-refresh every 5 minutes (300 seconds)
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivities();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (iconName: string) => {
    const icons: any = {
      UserPlus,
      UserCheck,
      CheckCircle,
      DollarSign,
      Heart,
      Calendar,
      Home,
    };
    return icons[iconName] || Activity;
  };

  const handleAddMember = () => {
    navigate('/members?add=true');
  };

  const handleCheckIn = () => {
    navigate('/attendance?checkin=true');
  };

  const handleRecordDonation = () => {
    navigate('/donations');
  };

  const handleScheduleVolunteer = () => {
    navigate('/volunteers');
  };

  const handleManualIngestion = async () => {
    setIsIngestingForms(true);
    try {
      const res: any = await api.forms.ingestAll();
      
      // Hard refresh of dashboard data so new ingested rows are visible immediately
      await fetchDashboardData();
      await fetchRecentActivities();
      
      // Clear IndexedDB cache and broadcast refresh event to all components
      await cacheInvalidationService.invalidateMembersCaches();
      
      // Show subtle success toast
      toast({
        title: "Data Updated",
        description: `Form ingestion complete. New data loaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Form ingestion failed",
        description: error?.message || "Could not start ingestion.",
        variant: "destructive",
      });
    } finally {
      setIsIngestingForms(false);
    }
  };


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-large">
        <div className="flex items-center justify-between">
          <div>
            {authLoading ? (
              <>
                <Skeleton className="h-10 w-64 mb-2 bg-white/20" />
                <Skeleton className="h-6 w-96 bg-white/20" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {staffRole} {displayName}
                </h1>
                <p className="text-lg opacity-90">Here's what's happening at TCC today</p>
              </>
            )}
          </div>
          <div className="text-right opacity-90">
            <p className="text-sm">Today's Date</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid - Row 1: Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoadingMetrics ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-soft">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : metricsError ? (
          <div className="col-span-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Metrics Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{metricsError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={isLoadingMetrics}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>            {/* Total Members */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{dashboardStats?.activeMembers || 0} active members</p>
              </CardContent>
            </Card>
            
            {/* Total Families */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Total Families
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.totalFamilies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered families</p>
              </CardContent>
            </Card>
            
            {/* Guest Conversion */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Guest Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.conversionRate > 20 ? "Good conversion" : "Track conversions"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Second Row: Guest Stats, Quick Actions, and Donations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoadingMetrics ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="shadow-soft">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : metricsError ? null : (
          <>
            {/* Guest Statistics - 1 column */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Guest Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <Badge variant="secondary" className="text-xs">{stats?.totalGuests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">New (30d)</span>
                    <Badge variant="default" className="text-xs">{stats?.newGuests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Conversion</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {stats?.conversionRate || 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions - 2 columns */}
            <Card className="shadow-soft md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" size="sm" className="h-20 flex-col gap-2" onClick={handleAddMember}>
                    <Users className="w-5 h-5" />
                    <span className="text-xs">Add Member</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-20 flex-col gap-2" onClick={handleCheckIn}>
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs">Check-in</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-20 flex-col gap-2" onClick={handleRecordDonation}>
                    <Heart className="w-5 h-5" />
                    <span className="text-xs">Donation</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-20 flex-col gap-2" onClick={handleScheduleVolunteer}>
                    <UserCheck className="w-5 h-5" />
                    <span className="text-xs">Volunteer</span>
                  </Button>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleManualIngestion}
                    disabled={isIngestingForms}
                    className="flex items-center gap-2"
                  >
                    {isIngestingForms ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Ingest Forms
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold">Total Staff:</span> {dashboardStats?.activeStaff || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Stacked Donations - 1 column with 2 cards */}
            <div className="space-y-4">
              {/* Total Donations */}
              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">Coming Soon</div>
                  <p className="text-xs text-muted-foreground mt-1">Feature in development</p>
                </CardContent>
              </Card>
              
              {/* Pending Donations */}
              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Pending Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">Coming Soon</div>
                  <p className="text-xs text-muted-foreground mt-1">Feature in development</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </span>
              {isLoadingActivities && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{activitiesError}</AlertDescription>
              </Alert>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {recentActivity.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.icon);
                  return (
                    <div key={activity.id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                        <IconComponent className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary uppercase">{activity.type}</span>
                          {activity.status && (
                            <Badge variant={activity.status === 'Pending' ? 'destructive' : 'default'} className="text-xs">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoadingActivities && !activitiesError && recentActivity.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleLoadMore}
                >
                  Load More Activities
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No Upcoming Events</p>
                <Button variant="link" size="sm" onClick={() => navigate('/attendance')} className="mt-2">
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {upcomingEvents.map((gathering, index) => (
                  <div key={gathering.gatheringID || index} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/attendance`)}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{gathering.gatheringName || 'Untitled Event'}</h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(gathering.gatheringDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(gathering.gatheringDate).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{gathering.gatheringType || 'Event'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Activities Modal */}
      <Dialog open={showActivitiesModal} onOpenChange={setShowActivitiesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              All Activities
            </DialogTitle>
            <DialogDescription>
              View and search through all recent activities
            </DialogDescription>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search activities by type, description, or name..."
              value={activitySearchQuery}
              onChange={(e) => setActivitySearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Activities List */}
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoadingAllActivities ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm mt-1">
                  {activitySearchQuery ? 'Try adjusting your search' : 'No activities to display'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.icon);
                  return (
                    <div 
                      key={activity.id || index} 
                      className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            {activity.type}
                          </span>
                          {activity.status && (
                            <Badge 
                              variant={activity.status === 'Pending' ? 'destructive' : 'default'} 
                              className="text-xs"
                            >
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm mb-1">{activity.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(activity.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {!isLoadingAllActivities && filteredActivities.length > 0 && (
            <div className="pt-4 border-t text-sm text-muted-foreground text-center">
              Showing {filteredActivities.length} of {allActivities.length} activities
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}