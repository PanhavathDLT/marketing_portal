import { StatsCards } from "@/features/analytics/components/StatsCards";
import { CheckInChart } from "@/features/analytics/components/CheckInChart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground">Platform performance at a glance</p>
      </div>
      <StatsCards />
      <div className="grid gap-6 lg:grid-cols-2">
        <CheckInChart />
      </div>
    </div>
  );
}
