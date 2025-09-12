// ID generator using crypto.randomUUID when available
function generateId(): string {
  const globalAny: any = globalThis as any;
  const cryptoObj = globalAny.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type AuthPurpose = "signup" | "login";

export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
  createdAt: number;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

interface PendingOtp {
  phone: string;
  code: string;
  purpose: AuthPurpose;
  name?: string;
  expiresAt: number;
}

const STORAGE_KEYS = {
  users: "auth_users",
  session: "auth_session",
  pending: "auth_pending_otp",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function now(): number {
  return Date.now();
}

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
  private static instance: AuthService | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) AuthService.instance = new AuthService();
    return AuthService.instance;
  }

  async startSignup(phone: string, name: string): Promise<{ phone: string; maskedDestination: string }> {
    const code = generateOtpCode();
    const pending: PendingOtp = {
      phone,
      code,
      purpose: "signup",
      name,
      expiresAt: now() + 5 * 60 * 1000,
    };
    writeJson(STORAGE_KEYS.pending, pending);
    return { phone, maskedDestination: this.maskPhone(phone) };
  }

  async startLogin(phone: string): Promise<{ phone: string; maskedDestination: string }> {
    const code = generateOtpCode();
    const pending: PendingOtp = {
      phone,
      code,
      purpose: "login",
      expiresAt: now() + 5 * 60 * 1000,
    };
    writeJson(STORAGE_KEYS.pending, pending);
    return { phone, maskedDestination: this.maskPhone(phone) };
  }

  async resendOtp(): Promise<{ phone: string; maskedDestination: string }> {
    const pending = readJson<PendingOtp | null>(STORAGE_KEYS.pending, null);
    if (!pending) throw new Error("No pending OTP session");
    pending.code = generateOtpCode();
    pending.expiresAt = now() + 5 * 60 * 1000;
    writeJson(STORAGE_KEYS.pending, pending);
    return { phone: pending.phone, maskedDestination: this.maskPhone(pending.phone) };
  }

  async verifyOtp(code: string): Promise<AuthUser> {
    const pending = readJson<PendingOtp | null>(STORAGE_KEYS.pending, null);
    if (!pending) throw new Error("No pending OTP session");
    if (pending.expiresAt < now()) throw new Error("OTP expired");
    if (pending.code !== code) throw new Error("Invalid OTP code");

    let users = readJson<AuthUser[]>(STORAGE_KEYS.users, []);
    let user = users.find((u) => u.phone === pending.phone) || null;

    if (!user && pending.purpose === "signup") {
      user = {
        id: generateId(),
        phone: pending.phone,
        name: pending.name,
        createdAt: now(),
      };
      users.push(user);
      writeJson(STORAGE_KEYS.users, users);
    }

    if (!user && pending.purpose === "login") {
      // Auto-provision user on first login if not found
      user = {
        id: generateId(),
        phone: pending.phone,
        createdAt: now(),
      };
      users.push(user);
      writeJson(STORAGE_KEYS.users, users);
    }

    if (!user) throw new Error("User not found");

    this.createSession(user.id);
    localStorage.removeItem(STORAGE_KEYS.pending);
    return user;
  }

  getCurrentUser(): AuthUser | null {
    const session = readJson<AuthSession | null>(STORAGE_KEYS.session, null);
    if (!session) return null;
    if (session.expiresAt < now()) {
      this.logout();
      return null;
    }
    const users = readJson<AuthUser[]>(STORAGE_KEYS.users, []);
    const user = users.find((u) => u.id === session.userId) || null;
    if (!user) {
      this.logout();
      return null;
    }
    return user;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  getPending(): Omit<PendingOtp, "code"> | null {
    const pending = readJson<PendingOtp | null>(STORAGE_KEYS.pending, null);
    if (!pending) return null;
    const { code: _omit, ...rest } = pending;
    return rest;
  }

  private createSession(userId: string): void {
    const session: AuthSession = {
      token: generateId(),
      userId,
      expiresAt: now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    writeJson(STORAGE_KEYS.session, session);
  }

  private maskPhone(phone: string): string {
    const clean = phone.replace(/[^\d+]/g, "");
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    return `***-***-${last4}`;
  }
}

export const authService = AuthService.getInstance();

