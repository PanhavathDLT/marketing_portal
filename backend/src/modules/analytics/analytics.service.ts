import prisma from '@lib/prisma.js';

export async function getOverview() {
  const [totalCustomers, totalCampaigns, totalRedemptions, totalPointsIssued] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.campaign.count(),
    prisma.redemption.count(),
    prisma.pointsHistory.aggregate({
      _sum: { points: true },
      where: { points: { gt: 0 } },
    }),
  ]);

  return {
    totalCustomers,
    totalCampaigns,
    totalRedemptions,
    totalPointsIssued: totalPointsIssued._sum.points ?? 0,
  };
}

export async function getCampaignStats(campaignId: number) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { missions: true },
  });

  if (!campaign) return null;

  const missionIds = campaign.missions.map((m) => m.id);

  const [totalParticipants, claimedCount] = await Promise.all([
    prisma.customerMission.groupBy({
      by: ['customerId'],
      where: { missionId: { in: missionIds } },
    }),
    prisma.customerMission.count({
      where: { missionId: { in: missionIds }, status: 'CLAIMED' },
    }),
  ]);

  return {
    campaign,
    totalParticipants: totalParticipants.length,
    totalClaimedMissions: claimedCount,
  };
}

export async function getCheckInStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalToday, totalAllTime] = await Promise.all([
    prisma.checkIn.count({ where: { createdAt: { gte: today } } }),
    prisma.checkIn.count(),
  ]);

  return { totalToday, totalAllTime };
}
