import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  UsersRound,
  LogOut
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & metrics",
    resource: "dashboard", // Always visible
    alwaysVisible: true
  },
  {
    title: "Members",
    url: "/members",
    icon: Users,
    description: "Membership management",
    resource: "members"
  },
  {
    title: "Families",
    url: "/families",
    icon: Home,
    description: "Family units",
    resource: "families"
  },
  {
    title: "Groups",
    url: "/groups",
    icon: UsersRound,
    description: "Departments & ministries",
    resource: "groups"
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Calendar,
    description: "Event check-ins",
    resource: "attendance"
  },
  {
    title: "Volunteers",
    url: "/volunteers",
    icon: UserCheck,
    description: "Volunteer scheduling",
    resource: "volunteers"
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    description: "Reports & insights",
    resource: "reports",
    customPermission: "can_generate_reports" // Custom permission for analytics
  },
  {
    title: "Communications",
    url: "/communications",
    icon: MessageSquare,
    description: "Bulk messaging",
    resource: "communications"
  },
];

const adminItems = [
  {
    title: "Staff Management",
    url: "/staff",
    icon: Shield,
    description: "User permissions",
    resource: "staff"
  },
  {
    title: "Donations",
    url: "/donations",
    icon: Heart,
    description: "Donation tracking",
    resource: "donations"
  },
  {
    title: "Branches",
    url: "/branches",
    icon: Building2,
    description: "Church locations",
    resource: "branches"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System configuration",
    resource: "settings",
    alwaysVisible: true
  }
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const { canView, hasPermission } = usePermission();
  const { logout, user } = useAuth();
  const { toast } = useToast();

  // Filter navigation items by permissions
  const visibleNavigationItems = navigationItems.filter(item => {
    if (item.alwaysVisible) return true;
    if (item.customPermission) return hasPermission(item.customPermission);
    return canView(item.resource);
  });

  const visibleAdminItems = adminItems.filter(item => {
    if (item.alwaysVisible) return true;
    if (item.customPermission) return hasPermission(item.customPermission);
    return canView(item.resource);
  });

  // Check if any admin page is active to determine initial state
  const isAdminPageActive = visibleAdminItems.some(item => {
    if (item.url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(item.url);
  });

  // State for administration section collapse (always start open by default)
  const [adminOpen, setAdminOpen] = useState(true);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

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
      <SidebarContent className={`bg-sidebar ${collapsed ? 'overflow-y-auto scrollbar-thin' : ''}`}>
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
        <SidebarGroup className={collapsed ? 'py-2' : 'mt-2'}>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-1">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? 'gap-1' : 'gap-3'}>
              {visibleNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                    className={collapsed ? 'py-2' : ''}
                  >
                    <NavLink 
                      to={item.url}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 ${getNavClassName(item.url)}`}
                    >
                      <item.icon className={collapsed ? 'w-4 h-4 flex-shrink-0' : 'w-5 h-5 flex-shrink-0'} />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs opacity-70 truncate">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only show if user has access to at least one admin item */}
        {visibleAdminItems.length > 0 && (
          <SidebarGroup className={collapsed ? 'py-2' : ''}>
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen} className="group/collapsible">
              {!collapsed && (
                <SidebarGroupLabel asChild className="text-sidebar-foreground/70 font-medium">
                  <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent/50 rounded-lg px-2 py-1.5 transition-colors">
                    <span>Administration</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminOpen ? '' : '-rotate-90'}`} />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className={collapsed ? 'gap-1' : 'gap-3'}>
                    {visibleAdminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive(item.url)}
                          tooltip={collapsed ? item.title : undefined}
                          className={collapsed ? 'py-2' : ''}
                        >
                          <NavLink 
                            to={item.url} 
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 ${getNavClassName(item.url)}`}
                          >
                            <item.icon className={collapsed ? 'w-4 h-4 flex-shrink-0' : 'w-5 h-5 flex-shrink-0'} />
                            {!collapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.title}</div>
                                <div className="text-xs opacity-70 truncate">{item.description}</div>
                              </div>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>      
      {/* Footer with Logout */}
      <SidebarFooter className={`border-t border-sidebar-border ${collapsed ? 'p-2' : 'p-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 mb-2">
            {user && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {user.role || 'Staff'}
                </p>
              </div>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
          size={collapsed ? "sm" : "default"}
        >
          <LogOut className={collapsed ? 'w-4 h-4' : 'w-4 h-4 mr-2'} />
          {!collapsed && "Logout"}
        </Button>
      </SidebarFooter>    </Sidebar>
  );
}