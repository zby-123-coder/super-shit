import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  appProfile,
  authCredential,
  authSession,
} from '@server/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '@shared/api.interface';

type CredentialRow = typeof authCredential.$inferSelect;
type SessionRow = typeof authSession.$inferSelect;

const SESSION_DAYS = 30;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  lockedUntil: number;
}

/** 登录防爆破：登录名 + IP 双维度，内存计数（单机部署够用） */
const loginAttempts = new Map<string, AttemptRecord>();

function attemptKey(loginName: string, ip: string): string {
  return `${loginName}@${ip}`;
}

export function checkLoginAllowed(loginName: string, ip: string): void {
  const record = loginAttempts.get(attemptKey(loginName, ip));
  if (record && record.lockedUntil > Date.now()) {
    const waitMin = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    throw new UnauthorizedException(
      `尝试次数过多，请 ${waitMin} 分钟后再试`,
    );
  }
}

export function recordLoginFailure(loginName: string, ip: string): void {
  const key = attemptKey(loginName, ip);
  const record = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_LOCK_MS;
    record.count = 0;
  }
  loginAttempts.set(key, record);
}

export function clearLoginFailures(loginName: string, ip: string): void {
  loginAttempts.delete(attemptKey(loginName, ip));
}

/** 密码哈希：scrypt（慢哈希），格式 salt:hash，不存明文 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const derived = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, 'hex');
  if (expectedBuf.length !== derived.length) return false;
  return timingSafeEqual(derived, expectedBuf);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private newUserId(): string {
    return `u_${randomBytes(8).toString('hex')}`;
  }

  /** 颁发会话：返回给客户端原始 token，库里只存 sha256 */
  private async issueSession(
    userId: string,
    deviceLabel?: string,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
    await this.db.insert(authSession).values({
      userId,
      tokenHash,
      deviceLabel: deviceLabel ?? null,
      expiresAt,
    });
    return token;
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const loginName = payload.loginName.trim();
    if (loginName.length < 4) {
      throw new ConflictException('登录名至少 4 位（手机号或账号）');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new ConflictException('密码至少 6 位');
    }
    const exists: CredentialRow[] = await this.db
      .select()
      .from(authCredential)
      .where(eq(authCredential.loginName, loginName))
      .limit(1);
    if (exists.length > 0) {
      throw new ConflictException('该登录名已注册');
    }

    const userId = this.newUserId();
    const inviteCode = randomBytes(3).toString('hex').toUpperCase();
    await this.db.insert(appProfile).values({
      userId,
      role: payload.role,
      name: payload.name.trim(),
      phone: payload.phone ?? null,
      grade: payload.grade ?? null,
      subjectTags: payload.subjectTags ?? null,
      inviteCode,
    });
    await this.db.insert(authCredential).values({
      userId,
      loginName,
      passwordHash: hashPassword(payload.password),
    });
    const token = await this.issueSession(userId, payload.role);
    return {
      token,
      userId,
      role: payload.role,
      name: payload.name.trim(),
      inviteCode,
    };
  }

  async login(payload: LoginRequest, ip = ''): Promise<AuthResponse> {
    const loginName = payload.loginName.trim();
    checkLoginAllowed(loginName, ip);
    const rows: CredentialRow[] = await this.db
      .select()
      .from(authCredential)
      .where(eq(authCredential.loginName, loginName))
      .limit(1);
    if (rows.length === 0) {
      recordLoginFailure(loginName, ip);
      throw new UnauthorizedException('登录名或密码不正确');
    }
    const credential = rows[0];
    if (!verifyPassword(payload.password, credential.passwordHash)) {
      recordLoginFailure(loginName, ip);
      throw new UnauthorizedException('登录名或密码不正确');
    }
    const profiles = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, credential.userId))
      .limit(1);
    if (profiles.length === 0) {
      throw new UnauthorizedException('账号档案不存在');
    }
    clearLoginFailures(loginName, ip);
    const profile = profiles[0];
    const token = await this.issueSession(credential.userId, profile.role);
    return {
      token,
      userId: credential.userId,
      role: profile.role as UserRole,
      name: profile.name ?? '',
      inviteCode: profile.inviteCode ?? '',
    };
  }

  /** 解析 token → userId；未命中/过期/已撤销均返回 null */
  async resolveToken(token: string): Promise<string | null> {
    if (!token) return null;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rows: SessionRow[] = await this.db
      .select()
      .from(authSession)
      .where(
        and(
          eq(authSession.tokenHash, tokenHash),
          isNull(authSession.revokedAt),
        ),
      )
      .limit(1);
    if (rows.length === 0) return null;
    const session = rows[0];
    if (session.expiresAt.getTime() < Date.now()) return null;
    await this.db
      .update(authSession)
      .set({ lastUsedAt: new Date() })
      .where(eq(authSession.id, session.id));
    return session.userId;
  }

  async revoke(token: string): Promise<void> {
    if (!token) return;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.db
      .update(authSession)
      .set({ revokedAt: new Date() })
      .where(eq(authSession.tokenHash, tokenHash));
  }

  /** 改密/异常时把该用户所有会话踢下线 */
  async revokeAll(userId: string): Promise<void> {
    await this.db
      .update(authSession)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSession.userId, userId), isNull(authSession.revokedAt)));
  }
}
