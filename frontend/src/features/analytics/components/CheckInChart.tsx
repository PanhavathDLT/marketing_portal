"use client";

import { CalendarCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCheckInAnalytics } from "../hooks/useAnalytics";

export function CheckInChart() {
  const { data, loading } = useCheckInAnalytics();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Daily Check-ins</CardTitle>
        <CardDescription>Check-in activity summary</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-16 w-full animate-pulse rounded bg-muted" />
            <div className="h-16 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarCheck className="h-4 w-4 text-brand" />
                <span className="text-xs font-medium">Today</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {(data?.totalToday ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">check-ins today</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-status-success" />
                <span className="text-xs font-medium">All Time</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {(data?.totalAllTime ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">total check-ins</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
