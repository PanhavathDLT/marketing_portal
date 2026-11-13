import { api } from "@/lib/api";
import type { Mission, MissionPayload } from "../types";

export const missionsApi = {
  list: (campaignId: number) =>
    api.get<Mission[]>(`/admin/campaigns/${campaignId}/missions`),
  create: (campaignId: number, payload: MissionPayload) =>
    // API requires campaignId in both the path and the request body
    api.post<Mission>(`/admin/campaigns/${campaignId}/missions`, {
      ...payload,
      campaignId,
    }),
  update: (campaignId: number, id: number, payload: Partial<MissionPayload>) =>
    api.patch<Mission>(`/admin/campaigns/${campaignId}/missions/${id}`, payload),
  delete: (campaignId: number, id: number) =>
    api.delete<void>(`/admin/campaigns/${campaignId}/missions/${id}`),
};
