import { Router, IRouter } from 'express';
import * as rewardController from './reward.controller.js';

const router: IRouter = Router();

// Points
router.get('/points', rewardController.getPoints);
router.get('/points/history', rewardController.getPointsHistory);

// Check-in
router.get('/check-in', rewardController.getCheckIn);
router.post('/check-in', rewardController.checkIn);

// Missions  — /api/v1/customer/reward/missions
router.get('/missions', rewardController.getCustomerMissions);
router.post('/missions/:missionId/claim', rewardController.claimMission);

// Reward store
router.get('/store', rewardController.getStore);
router.post('/store/:rewardId/redeem', rewardController.redeemReward);

// My rewards
router.get('/my-rewards', rewardController.getMyRewards);

export default router;
