export type SessionUser = { id: string } | null;

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export const authClient = {
  signup: (body: { email?: string; phone?: string; name?: string }) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email?: string; phone?: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body: { userId: string; code: string; purpose: "signup" | "login" }) =>
    request("/auth/otp/verify", { method: "POST", body: JSON.stringify(body) }),
  session: () => request("/auth/session", { method: "GET" }) as Promise<{ user: SessionUser }>,
  logout: () => request("/auth/logout", { method: "POST" }),
};

