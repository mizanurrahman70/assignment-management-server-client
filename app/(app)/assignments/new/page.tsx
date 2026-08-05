"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { AssignmentForm, type AssignmentFormValues } from "@/components/assignments/AssignmentForm";
import { useAuth } from "@/components/auth/auth-context";
import { useApi } from "@/lib/useApi";
import { assignmentsApi, classSubjectsApi, usersApi } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";

export default function NewAssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = useApi(() => classSubjectsApi.list(), [user?.id], true);
  const teachers = useApi(
    () => usersApi.list({ role: "Teacher", pageSize: 100 }),
    [user?.id],
    user?.role === "Admin",
  );

  const handleSubmit = async (values: AssignmentFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const assignment = await assignmentsApi.create({
        title: values.title,
        description: values.description ?? "",
        classId: values.classId,
        subjectId: values.subjectId,
        teacherId: user?.role === "Admin" ? values.teacherId : undefined,
        maxMarks: values.maxMarks,
        deadline: new Date(values.deadline).toISOString(),
      });
      router.push(`/assignments/${assignment.id}`);
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New assignment"
        description="Drafts are invisible to students until you publish them."
      />

      {links.loading ? (
        <Spinner label="Loading your classes and subjects..." />
      ) : links.error ? (
        <Alert tone="error">{links.error}</Alert>
      ) : !links.data?.length ? (
        <Card>
          <CardBody>
            <Alert tone="info">
              {user?.role === "Teacher"
                ? "You are not assigned to teach any class+subject yet. Ask an administrator to assign you."
                : "No active class-subject links exist. Create them under Teacher Assignments first."}
            </Alert>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Assignment details" />
          <CardBody>
            <AssignmentForm
              mode="create"
              assignment={null}
              links={links.data ?? []}
              teachers={teachers.data?.items ?? []}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
