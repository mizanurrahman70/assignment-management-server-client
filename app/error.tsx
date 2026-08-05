"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-red-600">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        An unexpected error occurred
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {error.message || "Please try again. If the problem persists, contact support."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
