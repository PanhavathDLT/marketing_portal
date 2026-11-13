"use client";

import { useCallback, useEffect, useState } from "react";
import { missionsApi } from "../api/missionsApi";
import type { Mission, MissionPayload } from "../types";

export function useMissions(campaignId: number | null) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!campaignId) {
      setMissions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await missionsApi.list(campaignId);
      setMissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load missions");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  async function createMission(payload: MissionPayload) {
    if (!campaignId) return;
    const created = await missionsApi.create(campaignId, payload);
    setMissions((prev) => [...prev, created]);
  }

  async function updateMission(id: number, payload: Partial<MissionPayload>) {
    if (!campaignId) return;
    const updated = await missionsApi.update(campaignId, id, payload);
    setMissions((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  async function deleteMission(id: number) {
    if (!campaignId) return;
    await missionsApi.delete(campaignId, id);
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }

  return { missions, loading, error, refetch: fetchMissions, createMission, updateMission, deleteMission };
}
