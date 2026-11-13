import { api } from "@/lib/api";
import type { Campaign, CampaignPayload } from "../types";

export const campaignsApi = {
  list: () => api.get<Campaign[]>("/admin/campaigns"),
  get: (id: number) => api.get<Campaign>(`/admin/campaigns/${id}`),
  create: (payload: CampaignPayload) => api.post<Campaign>("/admin/campaigns", payload),
  update: (id: number, payload: Partial<CampaignPayload>) =>
    api.patch<Campaign>(`/admin/campaigns/${id}`, payload),
  delete: (id: number) => api.delete<void>(`/admin/campaigns/${id}`),
};
