import prisma from '@lib/prisma.js';
import { AppError } from '@shared/errors/AppError.js';
import { MissionType, MissionStatus } from '@prisma/client';
import { CreateMissionInput, UpdateMissionInput } from './mission.schema.js';

export async function getMissionById(id: number) {
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) throw new AppError('Mission not found', 404);
  return mission;
}

export async function getMissionsForCampaign(campaignId: number) {
  return prisma.mission.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createMission(input: CreateMissionInput) {
  return prisma.mission.create({ data: input });
}

export async function updateMission(id: number, input: UpdateMissionInput) {
  await getMissionById(id);
  return prisma.mission.update({ where: { id }, data: input });
}

export async function deleteMission(id: number) {
  await getMissionById(id);
  await prisma.mission.delete({ where: { id } });
}

// ─── Customer-facing ──────────────────────────────────────────────────────────

export async function getCustomerMissions(customerId: number) {
  // Get all missions from ACTIVE campaigns
  const missions = await prisma.mission.findMany({
    where: { campaign: { status: 'ACTIVE' } },
    orderBy: { createdAt: 'asc' },
  });

  // Get this customer's progress for all missions
  const customerMissions = await prisma.customerMission.findMany({
    where: { customerId },
  });

  const progressMap = new Map(customerMissions.map((cm) => [cm.missionId, cm.status]));

  return missions.map((m) => ({
    id: m.id,
    type: m.type as MissionType,
    title: m.title,
    points: m.points,
    iconUrl: m.iconUrl,
    status: (progressMap.get(m.id) ?? 'IN_PROGRESS') as MissionStatus,
  }));
}

export async function claimMission(customerId: number, missionId: number) {
  const mission = await getMissionById(missionId);

  const customerMission = await prisma.customerMission.findUnique({
    where: { customerId_missionId: { customerId, missionId } },
  });

  if (!customerMission || customerMission.status !== 'CLAIMABLE') {
    throw new AppError('Mission is not claimable', 409);
  }

  await prisma.$transaction([
    prisma.customerMission.update({
      where: { customerId_missionId: { customerId, missionId } },
      data: { status: 'CLAIMED', claimedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: customerId },
      data: { points: { increment: mission.points } },
    }),
    prisma.pointsHistory.create({
      data: {
        customerId,
        source: 'MISSION',
        missionType: mission.type,
        title: mission.title,
        points: mission.points,
      },
    }),
  ]);
}
