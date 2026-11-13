import { Request, Response, NextFunction } from 'express';
import * as rewardService from './reward.service.js';
import * as missionService from '@modules/mission/mission.service.js';
import { success } from '@shared/utils/response.js';
import { User } from '@prisma/client';

export async function getPoints(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await rewardService.getPoints(user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getPointsHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await rewardService.getPointsHistory(user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCheckIn(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await rewardService.getCheckIn(user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    await rewardService.checkIn(user.id);
    success(res, {});
  } catch (err) {
    next(err);
  }
}

// Missions — /reward/missions
export async function getCustomerMissions(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await missionService.getCustomerMissions(user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function claimMission(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    await missionService.claimMission(user.id, Number(req.params.missionId));
    success(res, {});
  } catch (err) {
    next(err);
  }
}

export async function getStore(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await rewardService.getStore();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getMyRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await rewardService.getMyRewards(user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function redeemReward(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    await rewardService.redeemReward(user.id, Number(req.params.rewardId), idempotencyKey);
    success(res, {});
  } catch (err) {
    next(err);
  }
}

export async function getMyReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await rewardService.getMyReferralCode(user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function applyReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    const data = await rewardService.applyReferralCode(user.id, req.body.code);
    success(res, data);
  } catch (err) {
    next(err);
  }
}
