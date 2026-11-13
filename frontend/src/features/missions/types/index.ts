export type MissionType =
  | "REFERRAL"
  | "FIRST_LOAN_APPLICATION"
  | "FIRST_LOAN_APPROVAL"
  | "FIRST_REPAYMENT";

export interface Mission {
  id: number;
  campaignId: number;
  type: MissionType;
  title: string;
  points: number;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissionPayload {
  type: MissionType;
  title: string;
  points: number;
  iconUrl?: string;
}
