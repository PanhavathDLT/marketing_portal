"use client";

import { useEffect, useState } from "react";
import { campaignsApi } from "@/features/campaigns/api/campaignsApi";
import type { Campaign } from "@/features/campaigns/types";
import { MissionsPanel } from "./MissionsPanel";

export function MissionPageClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignsApi
      .list()
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return <MissionsPanel campaigns={campaigns} />;
}
