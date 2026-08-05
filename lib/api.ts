import type { ApiEnvelope } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "";

export type FieldErrors = string[] | Record<string, string[]> | null;

export class ApiError extends Error {
  status: number;
  errors?: FieldErrors;

  constructor(status: number, message: string, errors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, "Your session has expired. Please log in again.");
    this.name = "UnauthorizedError";
  }
}

const AUTH_EXPIRED_EVENT = "ams:session-expired";

export function notifySessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

const TOKEN_KEY = "ams_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, headers } = options;
  const token = getToken();

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (response.status === 401 && !path.includes("/auth/login")) {
    notifySessionExpired();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const envelope = payload as ApiEnvelope<unknown> | null;
    let message =
      envelope?.message ||
      (typeof payload === "string" ? payload : `Request failed (${response.status})`);
    if (!message && payload && typeof payload === "object" && "title" in payload) {
      message = String((payload as { title: unknown }).title);
    }
    let errors: FieldErrors = envelope?.errors ?? null;
    if (!errors && payload && typeof payload === "object" && "errors" in payload) {
      const raw = (payload as { errors: unknown }).errors;
      if (typeof raw === "string") errors = [raw];
      else if (Array.isArray(raw)) errors = raw.filter((x): x is string => typeof x === "string");
      else errors = raw as Record<string, string[]>;
    }
    throw new ApiError(response.status, message, errors);
  }

  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data == null && envelope.success !== true) {
      throw new ApiError(
        response.status,
        envelope.message || "Empty response from server",
        envelope.errors,
      );
    }
    return envelope.data as T;
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
