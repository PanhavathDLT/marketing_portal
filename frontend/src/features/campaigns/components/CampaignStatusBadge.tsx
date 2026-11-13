import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "../types";

const STATUS_MAP: Record<CampaignStatus, { label: string; variant: "success" | "muted" | "warning" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  DRAFT: { label: "Draft", variant: "warning" },
  INACTIVE: { label: "Inactive", variant: "muted" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
