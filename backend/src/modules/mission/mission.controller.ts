import { Request, Response, NextFunction } from 'express';
import * as missionService from './mission.service.js';
import { success } from '@shared/utils/response.js';
import { User } from '@prisma/client';

export async function getMissionsForCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await missionService.getMissionsForCampaign(Number(req.params.campaignId));
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createMission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await missionService.createMission(req.body);
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await missionService.updateMission(Number(req.params.id), req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteMission(req: Request, res: Response, next: NextFunction) {
  try {
    await missionService.deleteMission(Number(req.params.id));
    success(res, null);
  } catch (err) {
    next(err);
  }
}

// Customer-facing
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
