import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import { LoginPage } from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import MembersPage from "./pages/MembersPage";
import FamiliesPage from "./pages/FamiliesPage";
import GroupsPage from "./pages/GroupsPage";
import DonationsPage from "./pages/DonationsPage";
import AttendancePage from "./pages/AttendancePage";
import VolunteersPage from "./pages/VolunteersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import StaffPage from "./pages/StaffPage";
import BranchesPage from "./pages/BranchesPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute requiredPermission="can_view_members"><MembersPage /></ProtectedRoute>} />
            <Route path="/families" element={<ProtectedRoute requiredPermission="can_view_families"><FamiliesPage /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute requiredPermission="can_view_groups"><GroupsPage /></ProtectedRoute>} />
            <Route path="/donations" element={<ProtectedRoute requiredPermission="can_view_donations"><DonationsPage /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute requiredPermission="can_view_attendance"><AttendancePage /></ProtectedRoute>} />
            <Route path="/volunteers" element={<ProtectedRoute requiredPermission="can_view_volunteers"><VolunteersPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requiredPermission="can_view_reports"><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/communications" element={<ProtectedRoute requiredPermission="can_view_communications"><CommunicationsPage /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute requiredPermission="can_view_branches"><BranchesPage /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute requiredPermission="can_view_staff"><StaffPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
