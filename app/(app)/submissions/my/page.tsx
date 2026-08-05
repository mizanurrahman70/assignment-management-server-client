"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badges";
import { useAuth } from "@/components/auth/auth-context";
import { useApi } from "@/lib/useApi";
import { submissionsApi } from "@/lib/services";
import { formatDate } from "@/lib/utils";

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const submissions = useApi(
    () => submissionsApi.mine(),
    [user?.id],
    user?.role === "Student",
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="My submissions"
        description="Track the status of your submitted work."
      />

      <Card>
        {submissions.loading && <Spinner label="Loading submissions..." />}
        {submissions.error && (
          <div className="p-4">
            <Alert tone="error">{submissions.error}</Alert>
          </div>
        )}
        {!submissions.loading &&
          !submissions.error &&
          (submissions.data?.length ? (
            <div className="divide-y divide-gray-100">
              {submissions.data.map((s) => (
                <Link
                  key={s.id}
                  href={`/submissions/${s.id}`}
                  className="flex flex-col gap-2 px-5 py-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {s.assignmentTitle ?? "Assignment"}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-gray-500">
                      {s.subjectName && <span>{s.subjectName}</span>}
                      {s.className && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{s.className}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>Submitted {formatDate(s.submittedAt)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {s.marks !== null && s.marks !== undefined && (
                      <span className="text-sm font-semibold text-gray-700">
                        {s.marks}
                        {s.maxMarks ? `/${s.maxMarks}` : ""}
                      </span>
                    )}
                    <StatusBadge status={s.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No submissions yet"
              description="Submit an answer from an assignment page and it will show up here."
            />
          ))}
      </Card>
    </div>
  );
}
