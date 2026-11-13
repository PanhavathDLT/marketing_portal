import { Badge } from "@/components/ui/badge";
import type { MissionType } from "../types";

const TYPE_MAP: Record<MissionType, { label: string; variant: "new" | "info" | "success" | "warning" }> = {
  REFERRAL: { label: "Referral", variant: "new" },
  FIRST_LOAN_APPLICATION: { label: "1st Application", variant: "info" },
  FIRST_LOAN_APPROVAL: { label: "1st Approval", variant: "success" },
  FIRST_REPAYMENT: { label: "1st Repayment", variant: "warning" },
};

export function MissionTypeBadge({ type }: { type: MissionType }) {
  const { label, variant } = TYPE_MAP[type];
  return <Badge variant={variant}>{label}</Badge>;
}
