import { Construction } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const BranchesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Branches</h1>
            <p className="text-muted-foreground">Feature coming soon in Version 2</p>
          </div>
        </div>

        {/* Coming Soon Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <Construction className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900">Coming Soon</AlertTitle>
          <AlertDescription className="text-amber-800">
            Branch management features are currently under development and will be available in the next version.
            This will include branch creation, pastor assignment, member distribution, and inter-branch reporting.
          </AlertDescription>
        </Alert>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-muted-foreground">Coming Soon</div>
            </CardContent>
          </Card>
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-muted-foreground">Coming Soon</div>
            </CardContent>
          </Card>
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-muted-foreground">Coming Soon</div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Preview */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Create and manage multiple church branches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Assign pastors and leaders to each branch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Member distribution and transfer between branches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Branch-specific attendance and activity tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Consolidated reporting across all branches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Branch performance metrics and analytics</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchesPage;
