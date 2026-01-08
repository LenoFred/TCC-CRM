import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  Calendar, 
  UserCheck,
  BarChart3,
  MessageSquare,
  Settings,
  Shield,
  Building2,
  ChevronDown,
  Home,
  UsersRound
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & metrics"
  },
  {
    title: "Members",
    url: "/members",
    icon: Users,
    description: "Membership management"
  },
  {
    title: "Families",
    url: "/families",
    icon: Home,
    description: "Family units"
  },
  {
    title: "Groups",
    url: "/groups",
    icon: UsersRound,
    description: "Departments & ministries"
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Calendar,
    description: "Event check-ins"
  },
  {
    title: "Volunteers",
    url: "/volunteers",
    icon: UserCheck,
    description: "Volunteer scheduling"
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    description: "Reports & insights"
  },
  {
    title: "Communications",
    url: "/communications",
    icon: MessageSquare,
    description: "Bulk messaging"
  },
];

const adminItems = [
  {
    title: "Staff Management",
    url: "/staff",
    icon: Shield,
    description: "User permissions"
  },
  {
    title: "Donations",
    url: "/donations",
    icon: Heart,
    description: "Donation tracking"
  },
  {
    title: "Branches",
    url: "/branches",
    icon: Building2,
    description: "Church locations"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System configuration"
  }
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  // Check if any admin page is active to determine initial state
  const isAdminPageActive = adminItems.some(item => {
    if (item.url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(item.url);
  });

  // State for administration section collapse (always start open by default)
  const [adminOpen, setAdminOpen] = useState(true);

  // Prevent sidebar from expanding when clicking navigation items
  const handleNavClick = (e: React.MouseEvent) => {
    // Don't toggle sidebar state when collapsed and clicking nav items
    if (collapsed) {
      e.stopPropagation();
    }
  };

  // Add logo section at the top
  const Logo = () => (
    <div className="flex items-center space-x-2 px-3 py-4">
      <img src="/tcclogo.jpeg" alt="TCC Logo" className="w-8 h-8 rounded-lg" />
      {!collapsed && (
        <span className="font-bold text-lg text-sidebar-foreground">TCC</span>
      )}
    </div>
  );
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path)
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-4 border-primary rounded-lg"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors rounded-lg";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className={`bg-sidebar ${collapsed ? 'flex flex-col justify-evenly' : ''}`}>
        {/* Church Logo/Brand */}
        {!collapsed && (
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/tcclogo.jpeg" alt="TCC Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-sidebar-primary-foreground">TCC</h2>
                <p className="text-sm text-sidebar-foreground/70">CRM Dashboard</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className={collapsed ? '' : 'mt-2'}>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-1">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 ${getNavClassName(item.url)}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs opacity-70 truncate">{item.description}</div>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup>
          <Collapsible open={adminOpen} onOpenChange={setAdminOpen} className="group/collapsible">
            <SidebarGroupLabel asChild className="text-sidebar-foreground/70 font-medium">
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent/50 rounded-lg px-2 py-1.5 transition-colors">
                <span>Administration</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminOpen ? '' : '-rotate-90'}`} />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-3">
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={collapsed ? item.title : undefined}
                      >
                        <NavLink 
                          to={item.url} 
                          onClick={handleNavClick}
                          className={`flex items-center gap-3 ${getNavClassName(item.url)}`}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            <div className="text-xs opacity-70 truncate">{item.description}</div>
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}