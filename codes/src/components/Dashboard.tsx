import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGuests, useDonationVerification } from "@/hooks/useBusinessLogic";
import { dashboardService } from "@/services/businessLogicService";
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
  Activity
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivities();
    }, 60000);
    
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


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-large">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Pastor John</h1>
            <p className="text-lg opacity-90">Here's what's happening at TCC today</p>
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingMetrics ? (
          Array.from({ length: 6 }).map((_, index) => (
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
          <>
            {/* Total Members */}
            <MetricCard
              title="Total Members"
              value={dashboardStats?.totalMembers || 0}
              description={`${dashboardStats?.activeMembers || 0} active members`}
              trend={{ value: dashboardStats?.activeMembers || 0, isPositive: true }}
              icon={Users}
            />
            
            {/* Total Families */}
            <MetricCard
              title="Total Families"
              value={dashboardStats?.totalFamilies || 0}
              description="Registered families"
              trend={{ value: dashboardStats?.totalFamilies || 0, isPositive: true }}
              icon={Home}
            />
            
            {/* Pending Donations */}
            <MetricCard
              title="Pending Donations"
              value="Coming Soon"
              description="Feature in development"
              icon={DollarSign}
            />
            
            {/* Guest Conversion */}
            <MetricCard
              title="Guest Conversion"
              value={`${stats?.conversionRate || 0}%`}
              description={stats?.conversionRate > 20 ? "Good conversion" : "Track conversions"}
              trend={stats?.conversionRate > 20 ? { value: stats.conversionRate, isPositive: true } : { value: stats?.conversionRate || 0, isPositive: false }}
              icon={CheckCircle}
            />
          </>
        )}
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guest Statistics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Guest Statistics
              </span>
              {guestsLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {guestsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : guestsError ? (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{guestsError}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Guests</span>
                  <Badge variant="secondary">{stats?.totalGuests || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New (30 days)</span>
                  <Badge variant="default">{stats?.newGuests || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Returning</span>
                  <Badge variant="outline">{stats?.returningGuests || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats?.conversionRate || 0}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donation Statistics */}
        <Card className="shadow-soft opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Donation Status
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Coming Soon</span>
                {/* <Badge variant="secondary" className="text-muted-foreground">Coming Soon</Badge> */}
              </div>
              {/* <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verified (30d)</span>
                <Badge variant="secondary" className="text-muted-foreground">Coming Soon</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <Badge variant="secondary" className="text-muted-foreground">Coming Soon</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Donation</span>
                <Badge variant="secondary" className="text-muted-foreground">Coming Soon</Badge>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Return Visits</span>
                <Badge variant="secondary">{stats?.returnVisits || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Visit Count</span>
                <Badge variant="outline">{stats?.averageVisits?.toFixed(1) || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verification Rate</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {donationStats?.verificationRate || 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <Badge variant="outline" className="text-xs">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={handleAddMember}
              disabled={isLoadingMetrics}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Add Member</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={handleCheckIn}
              disabled={isLoadingMetrics}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Check-in</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={handleRecordDonation}
              disabled={isLoadingMetrics}
            >
              <Heart className="w-6 h-6" />
              <span className="text-sm">Record Donation</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={handleScheduleVolunteer}
              disabled={isLoadingMetrics}
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-sm">Schedule Volunteer</span>
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <p>No upcoming events</p>
                <Button variant="link" size="sm" onClick={() => navigate('/events')} className="mt-2">
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={event.eventId || index} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/events`)}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{event.eventName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.startTime || 'TBA'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location || 'Location TBA'}</span>
                      </div>
                      {event.description && (
                        <p className="text-xs mt-2 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}