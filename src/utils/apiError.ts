import { ApiError } from "@/services/apiClient";

export function formatApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details?.filter(Boolean).join(" · ");
    return details ? `${error.message}. ${details}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
