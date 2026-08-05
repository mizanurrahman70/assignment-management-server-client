"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublishBadge } from "@/components/ui/Badges";
import { useAuth } from "@/components/auth/auth-context";
import { useApi } from "@/lib/useApi";
import { assignmentsApi, classesApi, subjectsApi } from "@/lib/services";
import { formatDate, isOverdue } from "@/lib/utils";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const canManage = user?.role === "Admin" || user?.role === "Teacher";

  const assignments = useApi(
    () =>
      assignmentsApi.list({
        search: search || undefined,
        classId: classFilter ? Number(classFilter) : undefined,
        subjectId: subjectFilter ? Number(subjectFilter) : undefined,
      }),
    [search, classFilter, subjectFilter, user?.id],
  );

  const classes = useApi(() => classesApi.list(), []);
  const subjects = useApi(() => subjectsApi.list(), []);

  const showDeadline =
    user?.role === "Student" || user?.role === "Admin";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Assignments"
        description={
          user?.role === "Student"
            ? "Published assignments for your class."
            : user?.role === "Teacher"
              ? "Assignments you have created."
              : "All assignments across the school."
        }
        actions={
          canManage ? (
            <Link href="/assignments/new">
              <Button>New assignment</Button>
            </Link>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search assignments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
            aria-label="Search assignments"
          />
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="sm:max-w-[12rem]"
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="sm:max-w-[12rem]"
            aria-label="Filter by subject"
          >
            <option value="">All subjects</option>
            {subjects.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <p className="text-sm text-gray-500">
            {assignments.data?.length ?? 0}{" "}
            {assignments.data?.length === 1 ? "assignment" : "assignments"}
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {assignments.loading && <Spinner label="Loading assignments..." />}
          {assignments.error && (
            <div className="p-4">
              <Alert tone="error">{assignments.error}</Alert>
            </div>
          )}
          {!assignments.loading &&
            !assignments.error &&
            (assignments.data?.length ? (
              assignments.data.map((a) => {
                const overdue = isOverdue(a.deadline);
                return (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className="flex flex-col gap-2 px-5 py-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-gray-500">
                        <span>{a.className}</span>
                        <span aria-hidden="true">·</span>
                        <span>{a.subjectName}</span>
                        {user?.role !== "Student" && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{a.teacherName}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {showDeadline && (
                        <span
                          className={`text-xs font-medium ${
                            overdue ? "text-red-600" : "text-gray-500"
                          }`}
                        >
                          {overdue ? "Overdue · " : ""}
                          {formatDate(a.deadline)}
                        </span>
                      )}
                      {a.submissionCount !== undefined && canManage && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {a.submissionCount} submissions
                        </span>
                      )}
                      <PublishBadge published={a.isPublished} />
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                title="No assignments found"
                description={
                  canManage
                    ? "Create an assignment for a class and subject you are assigned to."
                    : "Your teacher hasn't published any assignments for your class yet."
                }
                action={
                  canManage ? (
                    <Link href="/assignments/new">
                      <Button>New assignment</Button>
                    </Link>
                  ) : undefined
                }
              />
            ))}
        </div>
      </Card>
    </div>
  );
}
