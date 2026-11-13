import { CampaignTable } from "@/features/campaigns/components/CampaignTable";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
        <p className="text-sm text-muted-foreground">Manage your marketing campaigns</p>
      </div>
      <CampaignTable />
    </div>
  );
}
