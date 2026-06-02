import crypto from 'node:crypto';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { config } from '../../config/index.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { AppError, ErrorCode } from '../../types/errors.js';
import type { LoginInput, PinLoginInput, RefreshInput } from './auth.schemas.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  tenantId: string;
  storeId: string;
  terminalId: string;
  role: string;
  jti: string;
}

/**
 * Generates access and refresh token pair for a user.
 * @param userId User identifier.
 * @param tenantId Tenant identifier.
 * @param storeId Store identifier.
 * @param role User role.
 * @param expiresIn Access token TTL.
 * @returns Token pair.
 */
const generateTokens = (userId: string, tenantId: string, storeId: string, terminalId: string, role: string, expiresIn: string): TokenPair => {
  const jti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { sub: userId, tenantId, storeId, terminalId, role, jti },
    config.jwtSecret,
    { expiresIn: expiresIn as unknown as number }
  );

  const refreshToken = jwt.sign(
    { sub: userId, tenantId, storeId, terminalId, role, jti: crypto.randomUUID() },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn as unknown as number }
  );

  return { accessToken, refreshToken };
};

/**
 * Stores a refresh token in Redis for revocation tracking.
 * @param userId User identifier.
 * @param refreshToken Refresh token string.
 * @returns Void.
 */
const storeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  const decoded = jwt.decode(refreshToken) as JwtPayload | null;
  if (!decoded) return;

  const ttlSeconds = 7 * 24 * 60 * 60;
  try {
    await redis.set(`refresh:${userId}:${decoded.jti}`, '1', 'EX', ttlSeconds);
  } catch {
    // Redis unavailable
  }
};

/**
 * Authenticates a user by email and password.
 * @param input Login credentials.
 * @returns Token pair and user data.
 * @throws AppError on invalid credentials.
 */
export const login = async (input: LoginInput): Promise<{ tokens: TokenPair; user: { id: string; email: string; firstName: string; lastName: string; role: string; tenantId: string; storeId: string; terminalId: string } }> => {
  const user = await prisma.user.findFirst({
    where: { email: input.email, isActive: true },
    include: { tenant: true }
  });

  if (!user) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  if (!user.tenant.isActive) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Tenant account is inactive', 403);
  }

  // Use user's designated store, else fall back to tenant's primary store
  const storeId = user.storeId ?? (await prisma.store.findFirst({
    where: { tenantId: user.tenantId, isActive: true },
    orderBy: { createdAt: 'asc' }
  }))?.id ?? '';

  const tokens = generateTokens(user.id, user.tenantId, storeId, '', user.role, config.jwtExpiresIn);
  await storeRefreshToken(user.id, tokens.refreshToken);

  return {
    tokens,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      storeId,
      terminalId: ''
    }
  };
};

/**
 * Authenticates a cashier by PIN at a specific terminal.
 * @param input PIN login credentials.
 * @returns Token pair and user data.
 * @throws AppError on invalid PIN or terminal.
 */
export const pinLogin = async (input: PinLoginInput): Promise<{ tokens: TokenPair; user: { id: string; email: string; firstName: string; lastName: string; role: string; tenantId: string; storeId: string; terminalId: string } }> => {
  const terminal = await prisma.terminal.findFirst({
    where: { id: input.terminalId, isActive: true },
    include: { store: true }
  });

  if (!terminal) {
    throw new AppError(ErrorCode.PIN_INVALID, 'Terminal not found or inactive', 401);
  }

  const cashiers = await prisma.user.findMany({
    where: { tenantId: terminal.tenantId, role: 'CASHIER', isActive: true }
  });

  let matchedUser: typeof cashiers[number] | null = null;

  for (const cashier of cashiers) {
    if (!cashier.pin) continue;
    const valid = await bcrypt.compare(input.pin, cashier.pin);
    if (valid) {
      matchedUser = cashier;
      break;
    }
  }

  if (!matchedUser) {
    throw new AppError(ErrorCode.PIN_INVALID, 'Invalid PIN', 401);
  }

  const tokens = generateTokens(
    matchedUser.id,
    terminal.tenantId,
    terminal.storeId,
    terminal.id,
    matchedUser.role,
    '8h'
  );
  await storeRefreshToken(matchedUser.id, tokens.refreshToken);

  return {
    tokens,
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      firstName: matchedUser.firstName,
      lastName: matchedUser.lastName,
      role: matchedUser.role,
      tenantId: matchedUser.tenantId,
      storeId: terminal.storeId,
      terminalId: terminal.id
    }
  };
};

/**
 * Issues a new access token from a valid refresh token.
 * @param input Refresh token input.
 * @returns New token pair.
 * @throws AppError if refresh token is invalid or revoked.
 */
export const refresh = async (input: RefreshInput): Promise<TokenPair> => {
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(input.refreshToken, config.jwtRefreshSecret) as JwtPayload;
  } catch {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Invalid or expired refresh token', 401);
  }

  const exists = await redis.get(`refresh:${decoded.sub}:${decoded.jti}`).catch(() => null);
  if (!exists) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Refresh token has been revoked', 401);
  }

  try {
    await redis.del(`refresh:${decoded.sub}:${decoded.jti}`);
  } catch {
    // Redis unavailable
  }

  const tokens = generateTokens(decoded.sub, decoded.tenantId, decoded.storeId, decoded.terminalId, decoded.role, config.jwtExpiresIn);
  await storeRefreshToken(decoded.sub, tokens.refreshToken);

  return tokens;
};

/**
 * Revokes a refresh token (logout).
 * @param input Refresh token to revoke.
 * @returns Void.
 */
export const logout = async (input: RefreshInput): Promise<void> => {
  try {
    const decoded = jwt.decode(input.refreshToken) as JwtPayload | null;
    if (decoded) {
      try {
        await redis.del(`refresh:${decoded.sub}:${decoded.jti}`);
      } catch {
        // Redis unavailable
      }
    }
  } catch {
    // Token already invalid — logout is still successful
  }
};
