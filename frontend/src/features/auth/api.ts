import { api } from "@/lib/api";
import type { AuthResponse, AuthUser } from "@/features/auth/types";
import type { Store } from "@/features/stores/types";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function googleSignIn(credential: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/auth/google/", {
    method: "POST",
    body: JSON.stringify({ credential }),
    skipAuth: true,
  });
  setToken(res.token);
  return res;
}

export interface EmailCredentials {
  email: string;
  password: string;
}

export async function register(body: EmailCredentials): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
  setToken(res.token);
  return res;
}

export async function emailLogin(body: EmailCredentials): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
  setToken(res.token);
  return res;
}

export async function logout(): Promise<void> {
  try {
    await api<void>("/auth/logout/", { method: "POST" });
  } finally {
    clearToken();
  }
}

export async function me(): Promise<AuthUser> {
  return api<AuthUser>("/auth/me/");
}

export interface OnboardingInput {
  name: string;
  code: string;
  address?: string;
}

export interface OnboardingResponse {
  user: AuthUser;
  store: Store;
}

export async function completeOnboarding(
  body: OnboardingInput
): Promise<OnboardingResponse> {
  return api<OnboardingResponse>("/auth/onboarding/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
