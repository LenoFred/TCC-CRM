import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/families" element={<FamiliesPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/donations" element={<DonationsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/communications" element={<CommunicationsPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
