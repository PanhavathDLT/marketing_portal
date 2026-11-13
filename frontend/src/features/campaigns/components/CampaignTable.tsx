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
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignFormDialog } from "./CampaignFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useCampaigns } from "../hooks/useCampaigns";
import type { Campaign, CampaignPayload } from "../types";

export function CampaignTable() {
  const { campaigns, loading, error, createCampaign, updateCampaign, deleteCampaign } =
    useCampaigns();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleSubmit(payload: CampaignPayload) {
    if (editTarget) {
      await updateCampaign(editTarget.id, payload);
    } else {
      await createCampaign(payload);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(campaign: Campaign) {
    setEditTarget(campaign);
    setFormOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Campaigns</CardTitle>
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="px-6 py-4 text-sm text-status-danger">{error}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Start</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">End</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                      No campaigns yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{campaign.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {campaign.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CampaignStatusBadge status={campaign.status} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(campaign.startDate)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(campaign.endDate)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(campaign)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-status-danger focus:text-status-danger"
                              onClick={() => setDeleteTarget(campaign)}
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
        </CardContent>
      </Card>

      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        onSubmit={handleSubmit}
      />

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={deleteTarget.title}
          onConfirm={() => deleteCampaign(deleteTarget.id)}
        />
      )}
    </>
  );
}
