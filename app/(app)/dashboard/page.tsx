"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, PublishBadge } from "@/components/ui/Badges";
import { useAuth } from "@/components/auth/auth-context";
import { useApi } from "@/lib/useApi";
import { assignmentsApi, classesApi, subjectsApi, submissionsApi, usersApi } from "@/lib/services";
import { formatDate, isOverdue } from "@/lib/utils";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow"
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value ?? "—"}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isTeacher = user?.role === "Teacher";

  const users = useApi(
    () => usersApi.list({ pageSize: 1 }),
    [],
    isAdmin,
  );
  const classes = useApi(
    () => classesApi.list(),
    [],
    isAdmin,
  );
  const subjects = useApi(
    () => subjectsApi.list(),
    [],
    isAdmin,
  );
  const assignments = useApi(
    () => assignmentsApi.list(),
    [user?.id],
    true,
  );
  const submissions = useApi(
    () => submissionsApi.mine(),
    [user?.id],
    user?.role === "Student",
  );

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Here's an overview of your activity."
      />

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users" value={users.data?.totalCount ?? null} href="/users" />
          <StatCard label="Classes" value={classes.data?.length ?? null} href="/classes" />
          <StatCard label="Subjects" value={subjects.data?.length ?? null} href="/subjects" />
          <StatCard label="Assignments" value={assignments.data?.length ?? null} href="/assignments" />
        </div>
      )}

      {isTeacher && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="My assignments" value={assignments.data?.length ?? null} href="/assignments" />
        </div>
      )}

      {user.role === "Student" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Assignments for my class"
            value={assignments.data?.length ?? null}
            href="/assignments"
          />
          <StatCard
            label="My submissions"
            value={submissions.data?.length ?? null}
            href="/submissions/my"
          />
        </div>
      )}

      {isTeacher && (
        <Card>
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">My recent assignments</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assignments.loading && <Spinner label="Loading assignments..." />}
            {assignments.error && <Alert tone="error">{assignments.error}</Alert>}
            {!assignments.loading &&
              !assignments.error &&
              (assignments.data?.length ? (
                assignments.data.slice(0, 5).map((a) => (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="truncate text-sm text-gray-500">
                        {a.className} · {a.subjectName} · {formatDate(a.deadline)}
                      </p>
                    </div>
                    <PublishBadge published={a.isPublished} />
                  </Link>
                ))
              ) : (
                <EmptyState title="No assignments yet" description="Create your first assignment to get started." />
              ))}
          </div>
        </Card>
      )}

      {user.role === "Student" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Recent assignments</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {assignments.loading && <Spinner label="Loading assignments..." />}
              {assignments.error && <Alert tone="error">{assignments.error}</Alert>}
              {!assignments.loading &&
                !assignments.error &&
                (assignments.data?.length ? (
                  assignments.data.slice(0, 5).map((a) => (
                    <Link
                      key={a.id}
                      href={`/assignments/${a.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{a.title}</p>
                        <p className="truncate text-sm text-gray-500">
                          {a.subjectName} · {a.teacherName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isOverdue(a.deadline)
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isOverdue(a.deadline) ? "Overdue" : formatDate(a.deadline)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState title="No assignments for your class yet" />
                ))}
            </div>
          </Card>

          <Card>
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">My submissions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {submissions.loading && <Spinner label="Loading submissions..." />}
              {submissions.error && <Alert tone="error">{submissions.error}</Alert>}
              {!submissions.loading &&
                !submissions.error &&
                (submissions.data?.length ? (
                  submissions.data.slice(0, 5).map((s) => (
                    <Link
                      key={s.id}
                      href={`/submissions/${s.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {s.assignmentTitle ?? "Submission"}
                        </p>
                        <p className="truncate text-sm text-gray-500">{formatDate(s.submittedAt)}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </Link>
                  ))
                ) : (
                  <EmptyState title="No submissions yet" description="Submit your work to track it here." />
                ))}
            </div>
          </Card>
        </div>
      )}

      {isAdmin && (
        <Card>
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Quick actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/users", label: "Manage users" },
              { href: "/classes", label: "Manage classes" },
              { href: "/subjects", label: "Manage subjects" },
              { href: "/class-subjects", label: "Assign teachers" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
