import prisma from '@lib/prisma.js';
import { AppError } from '@shared/errors/AppError.js';
import { CreateCampaignInput, UpdateCampaignInput } from './campaign.schema.js';

export async function listCampaigns() {
  return prisma.campaign.findMany({
    include: { missions: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listActiveCampaigns() {
  return prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    include: { missions: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCampaignById(id: number) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { missions: true },
  });
  if (!campaign) throw new AppError('Campaign not found', 404);
  return campaign;
}

export async function createCampaign(input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      title: input.title,
      description: input.description,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
    include: { missions: true },
  });
}

export async function updateCampaign(id: number, input: UpdateCampaignInput) {
  await getCampaignById(id);
  return prisma.campaign.update({
    where: { id },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
    include: { missions: true },
  });
}

export async function deleteCampaign(id: number) {
  await getCampaignById(id);
  await prisma.campaign.delete({ where: { id } });
}
