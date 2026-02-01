import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load critical pages
import { LoginPage } from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const FamiliesPage = lazy(() => import("./pages/FamiliesPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const DonationsPage = lazy(() => import("./pages/DonationsPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const VolunteersPage = lazy(() => import("./pages/VolunteersPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CommunicationsPage = lazy(() => import("./pages/CommunicationsPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const BranchesPage = lazy(() => import("./pages/BranchesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col gap-4 p-8">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/settings" element={<ProtectedRoute requiredPermission="can_view_settings"><SettingsPage /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          
          {/* Offline Indicator - Shows connection status and queued operations */}
          <OfflineIndicator />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
