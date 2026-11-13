"use client";

import { useCallback, useEffect, useState } from "react";
import { campaignsApi } from "../api/campaignsApi";
import type { Campaign, CampaignPayload } from "../types";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.list();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  async function createCampaign(payload: CampaignPayload) {
    const created = await campaignsApi.create(payload);
    setCampaigns((prev) => [created, ...prev]);
    return created;
  }

  async function updateCampaign(id: number, payload: Partial<CampaignPayload>) {
    const updated = await campaignsApi.update(id, payload);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  async function deleteCampaign(id: number) {
    await campaignsApi.delete(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  return { campaigns, loading, error, refetch: fetchCampaigns, createCampaign, updateCampaign, deleteCampaign };
}
