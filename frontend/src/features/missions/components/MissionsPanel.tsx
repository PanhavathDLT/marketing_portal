"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionTypeBadge } from "./MissionTypeBadge";
import { MissionFormDialog } from "./MissionFormDialog";
import { MissionDeleteDialog } from "./MissionDeleteDialog";
import { useMissions } from "../hooks/useMissions";
import type { Campaign } from "@/features/campaigns/types";
import type { Mission, MissionPayload } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  campaigns: Campaign[];
}

export function MissionsPanel({ campaigns }: Props) {
  // IDs are numbers; Select needs string values — convert at the boundary
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    campaigns[0]?.id ?? null
  );

  const { missions, loading, error, createMission, updateMission, deleteMission } =
    useMissions(selectedCampaignId);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);

  async function handleSubmit(payload: MissionPayload) {
    if (editTarget) {
      await updateMission(editTarget.id, payload);
    } else {
      await createMission(payload);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(mission: Mission) {
    setEditTarget(mission);
    setFormOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Missions</CardTitle>
            <Select
              value={selectedCampaignId != null ? String(selectedCampaignId) : ""}
              onValueChange={(v) => setSelectedCampaignId(Number(v))}
            >
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="brand"
            size="sm"
            onClick={openCreate}
            disabled={!selectedCampaignId}
          >
            <Plus className="h-4 w-4" />
            New Mission
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {!selectedCampaignId ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Select a campaign to view its missions.
            </p>
          ) : error ? (
            <p className="px-6 py-4 text-sm text-status-danger">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Points</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : missions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                        No missions for this campaign yet.
                      </td>
                    </tr>
                  ) : (
                    missions.map((mission) => (
                      <tr
                        key={mission.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">{mission.title}</td>
                        <td className="px-6 py-4">
                          <MissionTypeBadge type={mission.type} />
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <span className="font-medium text-foreground">{mission.points}</span> pts
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(mission)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-status-danger focus:text-status-danger"
                                onClick={() => setDeleteTarget(mission)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <MissionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        onSubmit={handleSubmit}
      />

      {deleteTarget && (
        <MissionDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={deleteTarget.title}
          onConfirm={() => deleteMission(deleteTarget.id)}
        />
      )}
    </>
  );
}
