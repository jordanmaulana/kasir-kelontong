import { ApiError } from "@/lib/api";
import type {
  CashierLoginInput,
  CashierSession,
} from "@/features/cashier-auth/types";

const CASHIER_TOKEN_KEY = "cashier_token";
const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`;

export function getCashierToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CASHIER_TOKEN_KEY);
}

export function setCashierToken(token: string): void {
  localStorage.setItem(CASHIER_TOKEN_KEY, token);
}

export function clearCashierToken(): void {
  localStorage.removeItem(CASHIER_TOKEN_KEY);
}

interface CashierApiInit extends RequestInit {
  skipAuth?: boolean;
}

async function cashierApi<T>(path: string, init?: CashierApiInit): Promise<T> {
  const { skipAuth, ...rest } = init ?? {};
  const token = !skipAuth ? getCashierToken() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((rest.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `CashierToken ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (data && (data.detail || JSON.stringify(data))) ||
      `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export async function cashierLogin(
  body: CashierLoginInput
): Promise<CashierSession> {
  const res = await cashierApi<CashierSession>("/auth/cashier-login/", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
  setCashierToken(res.token);
  return res;
}

export async function cashierLogout(): Promise<void> {
  try {
    await cashierApi<void>("/auth/cashier-logout/", { method: "POST" });
  } finally {
    clearCashierToken();
  }
}

export async function cashierMe(): Promise<CashierSession> {
  return cashierApi<CashierSession>("/auth/cashier-me/");
}
