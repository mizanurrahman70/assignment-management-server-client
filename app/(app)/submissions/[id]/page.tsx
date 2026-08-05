"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/Badges";
import { useAuth } from "@/components/auth/auth-context";
import { useApi } from "@/lib/useApi";
import { submissionsApi } from "@/lib/services";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/types";

const teacherStatuses: SubmissionStatus[] = ["InReview", "Returned", "Graded"];

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = Number(id);

  const submission = useApi(() => submissionsApi.get(submissionId), [submissionId]);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const data = submission.data;
  const maxMarks = data?.maxMarks ?? 100;

  const schema = useMemo(
    () =>
      z.object({
        marks: z.number({ message: "Marks are required" }).min(0, "Marks cannot be negative").max(maxMarks, `Marks cannot exceed ${maxMarks}`),
        feedback: z.string().max(2000).optional(),
      }),
    [maxMarks],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<{ marks: number; feedback?: string }>({
    resolver: zodResolver(schema),
    defaultValues: { marks: 0, feedback: "" },
  });

  useEffect(() => {
    const s = submission.data;
    if (!s) return;
    setValue("marks", s.marks ?? 0);
    setValue("feedback", s.feedback ?? "");
  }, [submission.data, setValue]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const isTeacher = user?.role === "Teacher";
  const isAdmin = user?.role === "Admin";
  const canReview = Boolean(data) && (isAdmin || isTeacher);

  const onGrade = async (values: { marks: number; feedback?: string }) => {
    setSaving(true);
    try {
      await submissionsApi.grade(submissionId, {
        marks: values.marks,
        feedback: values.feedback || null,
      });
      setNotice("Submission graded.");
      void submission.reload();
    } catch (e) {
      setNotice(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: SubmissionStatus) => {
    setStatusSaving(true);
    try {
      await submissionsApi.setStatus(submissionId, { status });
      setNotice(`Status set to ${status}.`);
      void submission.reload();
    } catch (e) {
      setNotice(getErrorMessage(e));
    } finally {
      setStatusSaving(false);
    }
  };

  if (submission.loading) return <Spinner label="Loading submission..." />;
  if (submission.error) return <Alert tone="error">{submission.error}</Alert>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {notice && <Alert tone="success">{notice}</Alert>}

      <PageHeader
        title="Submission"
        description={
          <>
            {data.assignmentTitle ? (
              <Link href={`/assignments/${data.assignmentId}`} className="text-indigo-600 hover:text-indigo-500">
                {data.assignmentTitle}
              </Link>
            ) : (
              "Assignment submission"
            )}
            {data.subjectName ? ` · ${data.subjectName}` : ""}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Answer"
              actions={<StatusBadge status={data.status} />}
            />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {data.content}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                Submitted {formatDate(data.submittedAt)}
              </p>
            </CardBody>
          </Card>

          {data.feedback && (
            <Card>
              <CardHeader title="Feedback" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {data.feedback}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Overview" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Student</dt>
                  <dd className="font-medium text-gray-900">{data.studentName ?? "Student"}</dd>
                </div>
                {data.className && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Class</dt>
                    <dd className="font-medium text-gray-900">{data.className}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <StatusBadge status={data.status} />
                  </dd>
                </div>
                {data.maxMarks !== undefined && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Max marks</dt>
                    <dd className="font-medium text-gray-900">{data.maxMarks}</dd>
                  </div>
                )}
                {data.marks !== null && data.marks !== undefined && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Marks</dt>
                    <dd className="font-semibold text-emerald-600">{data.marks}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {canReview && (
            <Card>
              <CardHeader title="Grade" description="Assign marks and feedback." />
              <CardBody>
                <form
                  onSubmit={handleSubmit(onGrade)}
                  className="space-y-4"
                  noValidate
                >
                  <Field
                    label={`Marks (out of ${maxMarks ?? "…"})`}
                    htmlFor="sub-marks"
                    error={errors.marks?.message}
                  >
                    <Input
                      id="sub-marks"
                      type="number"
                      min="0"
                      max={maxMarks}
                      step="any"
                      hasError={Boolean(errors.marks)}
                      {...register("marks", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="Feedback" htmlFor="sub-feedback" error={errors.feedback?.message}>
                    <Textarea
                      id="sub-feedback"
                      rows={4}
                      placeholder="What went well? How can they improve?"
                      hasError={Boolean(errors.feedback)}
                      {...register("feedback")}
                    />
                  </Field>
                  <Button type="submit" loading={saving} className="w-full">
                    Save grade
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {canReview && (
            <Card>
              <CardHeader title="Change status" description="Move the submission through the workflow." />
              <CardBody>
                <div className="flex flex-col gap-2">
                  {teacherStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={data.status === status ? "primary" : "secondary"}
                      onClick={() => setStatus(status)}
                      loading={statusSaving}
                      disabled={statusSaving}
                    >
                      Mark as {status}
                    </Button>
                  ))}
                  <p className="mt-2 text-xs text-gray-500">
                    Marking as Graded requires marks to be saved first.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {isTeacher && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push(`/assignments/${data.assignmentId}`)}
            >
              Back to assignment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
