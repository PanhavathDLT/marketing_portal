import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import prisma from '@lib/prisma.js';
import { env } from '@config/env.js';
import { AppError } from '@shared/errors/AppError.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

function generateReferralCode(): string {
  // 6-char uppercase alphanumeric, e.g. "LL7K2Q"
  return nanoid(6).toUpperCase();
}

function signTokens(userId: number, role: string) {
  const accessToken = jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ id: userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const hashed = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  // Resolve referrer
  let referredById: number | undefined;
  if (input.referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: input.referralCode },
    });
    // Invalid code must NOT block registration — silently skip
    if (referrer) referredById = referrer.id;
  }

  // Ensure unique referral code
  let referralCode = generateReferralCode();
  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode();
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      phone: input.phone,
      referralCode,
      referredById,
    },
  });

  const tokens = signTokens(user.id, user.role);
  return { user: sanitize(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const tokens = signTokens(user.id, user.role);
  return { user: sanitize(user), ...tokens };
}

export async function refreshTokens(token: string) {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new AppError('User not found', 401);

  return signTokens(user.id, user.role);
}

function sanitize(user: { id: number; email: string; name: string | null; role: string; tier: string; points: number }) {
  const { ...safe } = user;
  return safe;
}
