"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublishBadge, StatusBadge } from "@/components/ui/Badges";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { useApi } from "@/lib/useApi";
import {
  assignmentsApi,
  classSubjectsApi,
  submissionsApi,
  usersApi,
} from "@/lib/services";
import { formatDate, getErrorMessage, isOverdue } from "@/lib/utils";
import { AssignmentForm, type AssignmentFormValues } from "@/components/assignments/AssignmentForm";

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const assignmentId = Number(id);

  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const assignment = useApi(() => assignmentsApi.get(assignmentId), [assignmentId]);
  const canListSubmissions = user?.role === "Admin" || user?.role === "Teacher";
  const submissions = useApi(
    () => submissionsApi.listByAssignment(assignmentId),
    [assignmentId, user?.id],
    canListSubmissions,
  );
  const links = useApi(
    () => classSubjectsApi.list(),
    [user?.id],
    canListSubmissions,
  );
  const teachers = useApi(
    () => usersApi.list({ role: "Teacher", pageSize: 100 }),
    [user?.id],
    user?.role === "Admin",
  );
  const mine = useApi(
    () => submissionsApi.mine(),
    [user?.id],
    user?.role === "Student",
  );

  const mySubmission = useMemo(
    () => mine.data?.find((s) => s.assignmentId === assignmentId) ?? null,
    [mine.data, assignmentId],
  );

  useEffect(() => {
    // Sync the editable answer once the student's submission is loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mySubmission) setAnswer(mySubmission.content);
  }, [mySubmission]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const data = assignment.data;
  const isTeacher = user?.role === "Teacher";
  const isAdmin = user?.role === "Admin";
  const isStudent = user?.role === "Student";
  const canManage = isAdmin || (isTeacher && data?.teacherId === user?.id);
  const canEdit = canManage && Boolean(links.data?.length);
  const deadlinePassed = isOverdue(data?.deadline);

  const handleEdit = async (values: AssignmentFormValues) => {
    if (!data) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await assignmentsApi.update(assignmentId, {
        title: values.title,
        description: values.description ?? "",
        classId: values.classId,
        subjectId: values.subjectId,
        maxMarks: values.maxMarks,
        deadline: new Date(values.deadline).toISOString(),
      });
      setEditing(false);
      setNotice("Assignment updated.");
      void assignment.reload();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async () => {
    if (!data) return;
    try {
      await assignmentsApi.setPublished(assignmentId, !data.isPublished);
      setNotice(data.isPublished ? "Assignment moved to draft." : "Assignment published.");
      void assignment.reload();
      void submissions.reload();
    } catch (e) {
      setNotice(getErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    try {
      await assignmentsApi.remove(assignmentId);
      router.replace("/assignments");
    } catch (e) {
      setDeleteError(getErrorMessage(e));
      setDeleteLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    setSubmittingAnswer(true);
    setSubmitError(null);
    try {
      if (mySubmission) {
        await submissionsApi.update(mySubmission.id, { content: answer });
      } else {
        await submissionsApi.submit(assignmentId, { content: answer });
      }
      setNotice("Submission saved.");
      void mine.reload();
      void submissions.reload();
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (assignment.loading) return <Spinner label="Loading assignment..." />;
  if (assignment.error) return <Alert tone="error">{assignment.error}</Alert>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {notice && <Alert tone="success">{notice}</Alert>}

      <PageHeader
        title={data.title}
        description={`${data.className} · ${data.subjectName}`}
        actions={
          canManage ? (
            <>
              {canEdit && (
                <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
                  {editing ? "Cancel edit" : "Edit"}
                </Button>
              )}
              <Button
                variant={data.isPublished ? "secondary" : "success"}
                onClick={togglePublish}
              >
                {data.isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Details"
              actions={<PublishBadge published={data.isPublished} />}
            />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoItem label="Class" value={data.className} />
                <InfoItem label="Subject" value={data.subjectName} />
                <InfoItem label="Teacher" value={data.teacherName} />
                <InfoItem label="Max marks" value={data.maxMarks} />
                <InfoItem
                  label="Deadline"
                  value={
                    <span className={deadlinePassed ? "text-red-600" : undefined}>
                      {formatDate(data.deadline)}
                      {deadlinePassed && " (passed)"}
                    </span>
                  }
                />
                {data.submissionCount !== undefined && canManage && (
                  <InfoItem label="Submissions" value={data.submissionCount} />
                )}
              </dl>
              {data.description && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-900">Description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    {data.description}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {editing && canEdit && (
            <Card>
              <CardHeader title="Edit assignment" />
              <CardBody>
                <AssignmentForm
                  mode="edit"
                  assignment={data}
                  links={links.data ?? []}
                  teachers={teachers.data?.items ?? []}
                  submitting={submitting}
                  error={formError}
                  onSubmit={handleEdit}
                />
              </CardBody>
            </Card>
          )}

          {canManage && (
            <Card>
              <CardHeader
                title="Submissions"
                description="Review and grade student work."
              />
              {submissions.loading ? (
                <Spinner label="Loading submissions..." />
              ) : submissions.error ? (
                <div className="p-4">
                  <Alert tone="error">{submissions.error}</Alert>
                </div>
              ) : submissions.data?.length ? (
                <div className="divide-y divide-gray-100">
                  {submissions.data.map((s) => (
                    <Link
                      key={s.id}
                      href={`/submissions/${s.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {s.studentName ?? "Student"}
                        </p>
                        <p className="truncate text-sm text-gray-500">{formatDate(s.submittedAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {s.marks !== null && s.marks !== undefined && (
                          <span className="text-sm font-semibold text-gray-700">
                            {s.marks}/{data.maxMarks}
                          </span>
                        )}
                        <StatusBadge status={s.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="No submissions yet" description="Students haven&apos;t submitted anything for this assignment." />
              )}
            </Card>
          )}

          {isStudent && !data.isPublished && (
            <Card>
              <CardBody>
                <Alert tone="info">
                  This assignment hasn&apos;t been published yet. Check back later.
                </Alert>
              </CardBody>
            </Card>
          )}

          {isStudent && data.isPublished && (
            <Card>
              <CardHeader
                title={mySubmission ? "Your submission" : "Submit your answer"}
                description={
                  deadlinePassed
                    ? "The deadline has passed."
                    : `Due ${formatDate(data.deadline)}.`
                }
              />
              <CardBody>
                {mySubmission && (
                  <div className="mb-4 flex items-center gap-3">
                    <StatusBadge status={mySubmission.status} />
                    {mySubmission.marks !== null && mySubmission.marks !== undefined && (
                      <span className="text-sm font-semibold text-gray-700">
                        Marks: {mySubmission.marks}/{data.maxMarks}
                      </span>
                    )}
                  </div>
                )}
                {deadlinePassed && !mySubmission ? (
                  <Alert tone="error">The deadline has passed and you cannot submit now.</Alert>
                ) : mySubmission && mySubmission.status === "Graded" ? (
                  <Alert tone="info">
                    Your submission has been graded. You can no longer update it.
                  </Alert>
                ) : mySubmission && deadlinePassed ? (
                  <Alert tone="error">The deadline has passed; your submission can no longer be updated.</Alert>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSubmitAnswer();
                    }}
                    className="space-y-4"
                  >
                    {submitError && <Alert tone="error">{submitError}</Alert>}
                    <Field
                      label={mySubmission ? "Update your answer" : "Your answer"}
                      htmlFor="answer"
                    >
                      <Textarea
                        id="answer"
                        rows={6}
                        required
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Write your answer here…"
                      />
                    </Field>
                    <div className="flex justify-end">
                      <Button type="submit" loading={submittingAnswer}>
                        {mySubmission ? "Update submission" : "Submit"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick info" />
            <CardBody>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center justify-between">
                  <span>Created by</span>
                  <span className="font-medium text-gray-900">{data.teacherName}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Max marks</span>
                  <span className="font-medium text-gray-900">{data.maxMarks}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Status</span>
                  <PublishBadge published={data.isPublished} />
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete assignment"
        message="Are you sure you want to delete this assignment? Assignments with submissions cannot be deleted."
        confirmLabel="Delete"
        loading={deleteLoading}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteError(null);
        }}
        onConfirm={() => {
          setDeleteLoading(true);
          void handleDelete();
        }}
      />
      {deleteError && <Alert tone="error">{deleteError}</Alert>}
    </div>
  );
}
