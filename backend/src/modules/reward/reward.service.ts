import prisma from '@lib/prisma.js';
import { AppError } from '@shared/errors/AppError.js';
import { Tier } from '@prisma/client';
import {
  CHECK_IN_POINTS,
  CYCLE_LENGTH,
  TIER_THRESHOLDS,
  TIERS,
  TIMEZONE,
} from './reward.config.js';

// ─── Tier helpers ─────────────────────────────────────────────────────────────

function getTierForPoints(points: number): Tier {
  let tier: Tier = 'BRONZE';
  for (const t of TIERS) {
    if (points >= TIER_THRESHOLDS[t]) tier = t as Tier;
  }
  return tier;
}

function getNextTier(tier: Tier): Tier | null {
  const idx = TIERS.indexOf(tier);
  return idx < TIERS.length - 1 ? (TIERS[idx + 1] as Tier) : null;
}

// ─── Points ───────────────────────────────────────────────────────────────────

export async function getPoints(customerId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
  const tier = getTierForPoints(user.points);
  const nextTier = getNextTier(tier);
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const currentThreshold = TIER_THRESHOLDS[tier];

  const pointsToNextTier = nextThreshold ? Math.max(nextThreshold - user.points, 0) : 0;
  const range = nextThreshold ? nextThreshold - currentThreshold : 1;
  const progress = nextThreshold
    ? Math.min((user.points - currentThreshold) / range, 1)
    : 1;

  return {
    points: user.points,
    tier,
    tierName: tier.charAt(0) + tier.slice(1).toLowerCase(),
    nextTierName: nextTier
      ? nextTier.charAt(0) + nextTier.slice(1).toLowerCase()
      : null,
    pointsToNextTier,
    progress: parseFloat(progress.toFixed(3)),
  };
}

export async function getPointsHistory(customerId: number) {
  return prisma.pointsHistory.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Check-in ─────────────────────────────────────────────────────────────────

function todayInPhnomPenh(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // "YYYY-MM-DD"
}

function nextMidnightPhnomPenh(): Date {
  const now = new Date();
  const tomorrowStr = new Date(now.getTime() + 86400000).toLocaleDateString('en-CA', {
    timeZone: TIMEZONE,
  });
  // Build the midnight UTC equivalent for Phnom Penh (UTC+7)
  return new Date(`${tomorrowStr}T00:00:00+07:00`);
}

function resolveStreak(
  lastCheckInDate: Date | null,
  currentStreakDay: number,
): { streak: number; todayDay: number; checkedToday: boolean } {
  const today = todayInPhnomPenh();

  if (!lastCheckInDate) {
    return { streak: 0, todayDay: 1, checkedToday: false };
  }

  const last = lastCheckInDate.toISOString().slice(0, 10);

  if (last === today) {
    return { streak: currentStreakDay, todayDay: currentStreakDay, checkedToday: true };
  }

  const yesterday = new Date(Date.now() - 86400000)
    .toLocaleDateString('en-CA', { timeZone: TIMEZONE });

  if (last === yesterday) {
    if (currentStreakDay >= CYCLE_LENGTH) {
      return { streak: 0, todayDay: 1, checkedToday: false }; // cycle finished → new cycle
    }
    return { streak: currentStreakDay, todayDay: currentStreakDay + 1, checkedToday: false };
  }

  // Missed a day
  return { streak: 0, todayDay: 1, checkedToday: false };
}

export async function getCheckIn(customerId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
  const { streak, todayDay, checkedToday } = resolveStreak(
    user.lastCheckInDate,
    user.currentStreakDay,
  );

  const days = CHECK_IN_POINTS.map((pts, i) => ({
    day: i + 1,
    points: pts,
    isChecked: i + 1 <= streak,
    isToday: i + 1 === todayDay,
  }));

  return {
    streakDays: streak,
    canCheckInToday: !checkedToday,
    nextResetAt: nextMidnightPhnomPenh().toISOString(),
    days,
  };
}

export async function checkIn(customerId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
  const { checkedToday, todayDay } = resolveStreak(user.lastCheckInDate, user.currentStreakDay);

  if (checkedToday) throw new AppError('You have already checked in today.', 409);

  const todayDate = new Date(`${todayInPhnomPenh()}T00:00:00+07:00`);
  const pts = CHECK_IN_POINTS[todayDay - 1];

  await prisma.$transaction(async (tx) => {
    // Unique key prevents double check-in
    await tx.checkIn.create({
      data: {
        customerId,
        checkInDate: todayDate,
        day: todayDay,
        points: pts,
      },
    });

    await tx.user.update({
      where: { id: customerId },
      data: {
        lastCheckInDate: todayDate,
        currentStreakDay: todayDay,
        points: { increment: pts },
      },
    });

    await tx.pointsHistory.create({
      data: {
        customerId,
        source: 'CHECK_IN',
        title: 'Daily check-in',
        points: pts,
      },
    });
  });
}

// ─── Reward store ─────────────────────────────────────────────────────────────

export async function getStore() {
  const items = await prisma.rewardItem.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    points: item.points,
    imageUrl: item.imageUrl,
  }));
}

export async function getMyRewards(customerId: number) {
  const redemptions = await prisma.redemption.findMany({
    where: { customerId },
    include: { rewardItem: true },
    orderBy: { redeemedAt: 'desc' },
  });

  return redemptions.map((r) => ({
    id: r.id,
    title: r.rewardItem.title,
    points: r.points,
    imageUrl: r.rewardItem.imageUrl,
    status: r.status,
    redeemedAt: r.redeemedAt.toISOString(),
  }));
}

export async function redeemReward(
  customerId: number,
  rewardId: number,
  idempotencyKey?: string,
) {
  // Check idempotency
  if (idempotencyKey) {
    const existing = await prisma.redemption.findUnique({ where: { idempotencyKey } });
    if (existing) return; // Already processed
  }

  const item = await prisma.rewardItem.findUnique({ where: { id: rewardId } });
  if (!item) throw new AppError('Reward not found', 404);
  if (!item.isActive || item.stock <= 0) throw new AppError('Reward is out of stock', 409);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
  if (user.points < item.points) {
    throw new AppError('You do not have enough points for this reward.', 422);
  }

  await prisma.$transaction([
    prisma.rewardItem.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } },
    }),
    prisma.user.update({
      where: { id: customerId },
      data: { points: { decrement: item.points } },
    }),
    prisma.redemption.create({
      data: {
        customerId,
        rewardItemId: rewardId,
        points: item.points,
        idempotencyKey,
      },
    }),
    prisma.pointsHistory.create({
      data: {
        customerId,
        source: 'REDEEM',
        title: item.title,
        points: -item.points,
      },
    }),
  ]);
}

// ─── Referral ─────────────────────────────────────────────────────────────────

export async function getMyReferralCode(customerId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
  return { code: user.referralCode };
}

export async function applyReferralCode(customerId: number, code: string) {
  if (code === undefined) throw new AppError('Code is required', 422);

  const customer = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });

  if (customer.referralCode === code) throw new AppError('You cannot use your own referral code.', 422);
  if (customer.referredById) throw new AppError('You are already linked to a referrer.', 409);

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) throw new AppError('Referral code not found.', 404);

  await prisma.user.update({
    where: { id: customerId },
    data: { referredById: referrer.id },
  });

  return { referrerName: referrer.name ?? 'Unknown' };
}
