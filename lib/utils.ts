import type { SubmissionStatus, User } from "./types";
import type { FieldErrors } from "./api";

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateShort(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function isOverdue(deadline?: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export function fullName(user: Pick<User, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export const statusStyles: Record<SubmissionStatus, string> = {
  Submitted: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Resubmitted: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  InReview: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Returned: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Graded: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export const roleStyles: Record<User["role"], string> = {
  Admin: "bg-purple-50 text-purple-700 ring-purple-600/20",
  Teacher: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Student: "bg-teal-50 text-teal-700 ring-teal-600/20",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function getFieldErrors(
  error: unknown,
): Record<string, string[]> | undefined {
  if (error instanceof Error && "errors" in error) {
    const errors = (error as { errors?: FieldErrors }).errors;
    if (errors && !Array.isArray(errors)) return errors;
  }
  return undefined;
}

export function getFieldErrorMessages(error: unknown): string[] {
  if (error instanceof Error && "errors" in error) {
    const errors = (error as { errors?: FieldErrors }).errors;
    if (!errors) return [];
    if (Array.isArray(errors)) return errors;
    return Object.values(errors).flat();
  }
  return [];
}
