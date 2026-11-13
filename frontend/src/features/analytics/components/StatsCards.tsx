"use client";

import { Users, Megaphone, Gift, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsOverview } from "../hooks/useAnalytics";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-muted text-brand">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data, loading } = useAnalyticsOverview();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Customers"
        value={(data?.totalCustomers ?? 0).toLocaleString()}
        icon={Users}
        loading={loading}
      />
      <StatCard
        title="Total Campaigns"
        value={data?.totalCampaigns ?? 0}
        icon={Megaphone}
        loading={loading}
      />
      <StatCard
        title="Total Redemptions"
        value={(data?.totalRedemptions ?? 0).toLocaleString()}
        icon={Gift}
        loading={loading}
      />
      <StatCard
        title="Points Issued"
        value={(data?.totalPointsIssued ?? 0).toLocaleString()}
        icon={Coins}
        loading={loading}
      />
    </div>
  );
}
