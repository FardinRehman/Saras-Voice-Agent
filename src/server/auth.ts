import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { UserRole } from '../types/saras.ts';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  isActive: boolean;
}

export interface SessionToken {
  token: string;
  userId: string;
  role: UserRole;
  fullName: string;
  expiresAt: number;
  ipAddress: string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

class AuthService {
  private users: Map<string, AuthUser> = new Map();
  private sessions: Map<string, SessionToken> = new Map();
  private rateLimits: Map<string, RateLimitBucket> = new Map();

  constructor() {
    this.seedDefaultStaff();
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  }

  private seedDefaultStaff(): void {
    const defaultStaff = [
      {
        id: 'USR-SA-01',
        username: 'admin',
        fullName: 'Saras Chief Operations Officer',
        role: 'SUPER_ADMIN' as UserRole,
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Saras_SuperAdmin@2026!',
      },
      {
        id: 'USR-SL-02',
        username: 'sales_lead',
        fullName: 'Arunachalam Murugan (Head of Enterprise Engagements)',
        role: 'SALES_LEAD' as UserRole,
        password: process.env.INITIAL_SALES_PASSWORD || 'Saras_SalesLead@2026!',
      },
      {
        id: 'USR-ENG-03',
        username: 'ai_engineer',
        fullName: 'Deepika Raman (Principal AI Architect)',
        role: 'AI_ENGINEER' as UserRole,
        password: process.env.INITIAL_ENGINEER_PASSWORD || 'Saras_AiEng@2026!',
      },
      {
        id: 'USR-AUD-04',
        username: 'auditor',
        fullName: 'Karthik Subramanian (Quality & Compliance Lead)',
        role: 'AUDITOR' as UserRole,
        password: process.env.INITIAL_AUDITOR_PASSWORD || 'Saras_Auditor@2026!',
      },
    ];

    for (const staff of defaultStaff) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = this.hashPassword(staff.password, salt);
      this.users.set(staff.username, {
        id: staff.id,
        username: staff.username,
        fullName: staff.fullName,
        role: staff.role,
        passwordHash,
        salt,
        isActive: true,
      });
    }
  }

  public authenticate(
    username: string,
    password: string,
    ipAddress: string = '127.0.0.1'
  ): {
    success: boolean;
    token?: string;
    user?: { id: string; username: string; fullName: string; role: UserRole };
    error?: string;
  } {
    const user = this.users.get(username.toLowerCase());
    if (!user || !user.isActive) {
      db.recordAudit('AUTH', 'SYSTEM', 'LOGIN_FAILED', username, `Failed login attempt for unknown or inactive user: ${username}`, 'FAILURE', ipAddress);
      return { success: false, error: 'Invalid username or password.' };
    }

    if (!this.verifyPassword(password, user.passwordHash, user.salt)) {
      db.recordAudit(user.id, user.role, 'LOGIN_FAILED', user.id, `Incorrect password entered for user: ${username}`, 'FAILURE', ipAddress);
      return { success: false, error: 'Invalid username or password.' };
    }

    const token = `SARAS-SESSION-${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    this.sessions.set(token, {
      token,
      userId: user.id,
      role: user.role,
      fullName: user.fullName,
      expiresAt,
      ipAddress,
    });

    db.recordAudit(user.id, user.role, 'LOGIN_SUCCESS', user.id, `User ${user.username} authenticated successfully.`, 'SUCCESS', ipAddress);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  public validateSession(token: string): SessionToken | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  public revokeSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  public checkRateLimit(key: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    let bucket = this.rateLimits.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      this.rateLimits.set(key, bucket);
      return true;
    }

    bucket.count += 1;
    return bucket.count <= limit;
  }
}

export const authService = new AuthService();

export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.STRICT_AUTH !== 'true') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required.' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const session = authService.validateSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    if (!allowedRoles.includes(session.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient role permissions.' });
    }

    (req as any).user = session;
    next();
  };
}

export function rateLimit(limit: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const allowed = authService.checkRateLimit(ip, limit, windowMs);
    if (!allowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
}
