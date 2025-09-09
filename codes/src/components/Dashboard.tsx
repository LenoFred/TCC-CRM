import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Heart, 
  Calendar, 
  UserCheck,
  TrendingUp,
  Clock,
  MapPin,
  Phone
} from "lucide-react";

export function Dashboard() {
  const metrics = [
    {
      title: "Total Members",
      value: 847,
      description: "Active membership",
      icon: Users,
      trend: { value: 3.2, isPositive: true },
      variant: "primary" as const
    },
    {
      title: "This Month's Donations",
      value: "$12,450",
      description: "Goal: $15,000",
      icon: Heart,
      trend: { value: 8.1, isPositive: true },
      variant: "secondary" as const
    },
    {
      title: "Last Sunday Attendance", 
      value: 324,
      description: "73% of active members",
      icon: Calendar,
      trend: { value: 2.1, isPositive: false },
      variant: "accent" as const
    },
    {
      title: "Active Volunteers",
      value: 89,
      description: "Across all ministries",
      icon: UserCheck,
      trend: { value: 5.3, isPositive: true }
    }
  ];

  const recentActivity = [
    {
      type: "member",
      title: "New Member Joined",
      description: "Sarah Johnson completed membership process",
      time: "2 hours ago",
      icon: Users
    },
    {
      type: "donation",
      title: "Large Donation Received",
      description: "$2,500 from the Martinez Family",
      time: "5 hours ago", 
      icon: Heart
    },
    {
      type: "volunteer",
      title: "Volunteer Signup",
      description: "Mike Chen signed up for Sunday service",
      time: "1 day ago",
      icon: UserCheck
    },
    {
      type: "event",
      title: "Youth Group Meeting",
      description: "42 attendees checked in",
      time: "2 days ago",
      icon: Calendar
    }
  ];

  const upcomingEvents = [
    {
      title: "Sunday Service",
      date: "Tomorrow",
      time: "10:00 AM",
      location: "Main Sanctuary",
      attendees: "Expected: 320"
    },
    {
      title: "Youth Fellowship",
      date: "Friday",
      time: "7:00 PM", 
      location: "Fellowship Hall",
      attendees: "Expected: 45"
    },
    {
      title: "Prayer Meeting",
      date: "Wednesday",
      time: "6:30 PM",
      location: "Prayer Room",
      attendees: "Expected: 25"
    }
  ];

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
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
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
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Add Member</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Check-in</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Heart className="w-6 h-6" />
              <span className="text-sm">Record Donation</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
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
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <activity.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="p-4 rounded-lg border border-border hover:shadow-soft transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground">{event.title}</h4>
                    <span className="text-sm text-primary font-medium">{event.date}</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}