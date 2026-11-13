export type CampaignStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface Campaign {
  id: number;
  title: string;
  description: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignPayload {
  title: string;
  description: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
}
