const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

export class ApiError extends Error {
  public statusCode: number;
  public details?: string[];
  public isForbidden: boolean;

  constructor(message: string, statusCode: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isForbidden = statusCode === 403;
  }
}

export function isPermissionDeniedError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 403;
}

export function getPermissionDeniedMessage(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 403) {
    return error.message || "You do not have permission to perform this action";
  }
  return "You do not have permission to perform this action";
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 0;
}

export function getNetworkErrorMessage(): string {
  return "Unable to connect to the server. Please check your internet connection and ensure the backend is running.";
}

const REFRESH_TOKEN_KEY = "finanx_refresh_token";
const ACCESS_TOKEN_KEY = "finanx_access_token";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const json = await res.json();
  const { accessToken, refreshToken: newRefreshToken } = json.data as {
    accessToken: string;
    refreshToken: string;
  };

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  return accessToken;
}

async function request<T>(
  input: RequestInfo,
  init: RequestInit = {},
  _retry = false
): Promise<T> {
  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get("content-type") ?? "";
    const hasJson = contentType.includes("application/json");
    const payload = hasJson ? await response.json() : null;

    if (!response.ok) {
      // Auto-refresh on 401 (expired access token) — but not on auth endpoints
      if (
        response.status === 401 &&
        !_retry &&
        typeof input === "string" &&
        !input.includes("/auth/login") &&
        !input.includes("/auth/register") &&
        !input.includes("/auth/refresh")
      ) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise<T>((resolve, reject) => {
            refreshQueue.push((newToken: string) => {
              const newInit = {
                ...init,
                headers: {
                  ...(init.headers as Record<string, string>),
                  Authorization: `Bearer ${newToken}`,
                },
              };
              request<T>(input, newInit, true).then(resolve).catch(reject);
            });
          });
        }

        isRefreshing = true;
        try {
          const newToken = await doRefresh();
          // Flush queued requests
          refreshQueue.forEach((cb) => cb(newToken));
          refreshQueue = [];

          const newInit = {
            ...init,
            headers: {
              ...(init.headers as Record<string, string>),
              Authorization: `Bearer ${newToken}`,
            },
          };
          return request<T>(input, newInit, true);
        } catch {
          refreshQueue = [];
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.replace("/signin");
          throw new ApiError("Session expired. Please sign in again.", 401);
        } finally {
          isRefreshing = false;
        }
      }

      throw toApiError(response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(error.message, 0);
    }

    throw new ApiError("Unexpected error occurred", 0);
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  let message = "Request failed";
  let details: string[] | undefined;

  if (payload && typeof payload === "object") {
    const typed = payload as Record<string, unknown>;

    if (
      typed.error &&
      typeof typed.error === "object" &&
      typeof (typed.error as Record<string, unknown>).message === "string"
    ) {
      const errorDetails = typed.error as Record<string, unknown>;
      message = errorDetails.message as string;
      if (Array.isArray(errorDetails.details)) {
        details = errorDetails.details as string[];
      }
    } else if (typeof typed.message === "string") {
      message = typed.message;
      if (Array.isArray(typed.details)) {
        details = typed.details as string[];
      }
    }
  }

  return new ApiError(message, status, details);
}

export { API_BASE_URL, JSON_HEADERS, request };
