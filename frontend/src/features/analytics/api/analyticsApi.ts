import { api } from "@/lib/api";
import type { AnalyticsOverview, CheckInAnalytics } from "../types";

export const analyticsApi = {
  getOverview: () => api.get<AnalyticsOverview>("/admin/analytics/overview"),
  getCheckIns: () => api.get<CheckInAnalytics>("/admin/analytics/check-ins"),
};
