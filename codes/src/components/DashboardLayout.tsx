import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 h-auto min-h-16 border-b border-border bg-card shadow-soft flex flex-wrap items-center px-4 sm:px-6 py-3">
            <SidebarTrigger className="mr-4">
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-primary truncate">TCC Church</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}