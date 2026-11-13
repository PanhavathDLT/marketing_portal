import { Router, IRouter } from 'express';
import { validate } from '@shared/middleware/validate.middleware.js';
import { createMissionSchema, updateMissionSchema } from './mission.schema.js';
import * as missionController from './mission.controller.js';

// Admin routes — mounted at /api/v1/admin/campaigns/:campaignId/missions
export const adminMissionRouter: IRouter = Router({ mergeParams: true });

adminMissionRouter.get('/', missionController.getMissionsForCampaign);
adminMissionRouter.post('/', validate(createMissionSchema), missionController.createMission);
adminMissionRouter.patch('/:id', validate(updateMissionSchema), missionController.updateMission);
adminMissionRouter.delete('/:id', missionController.deleteMission);

// Note: customer-facing mission endpoints (/reward/missions) are served
// through the reward module to match the required path /customer/reward/missions
