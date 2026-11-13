import { MissionPageClient } from "@/features/missions/components/MissionPageClient";

export default function MissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Missions</h2>
        <p className="text-sm text-muted-foreground">Manage missions per campaign</p>
      </div>
      <MissionPageClient />
    </div>
  );
}
