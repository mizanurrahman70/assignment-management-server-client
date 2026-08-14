"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActiveBadge } from "@/components/ui/Badges";
import { ClassSubjectFormModal, type ClassSubjectFormValues } from "@/components/classSubjects/ClassSubjectFormModal";
import { useApi } from "@/lib/useApi";
import { classSubjectsApi, classesApi, subjectsApi, usersApi } from "@/lib/services";
import type { ClassSubject } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export default function ClassSubjectsPage() {
  const links = useApi(() => classSubjectsApi.list(), []);
  const classes = useApi(() => classesApi.list(), []);
  const subjects = useApi(() => subjectsApi.list(), []);
  const teachers = useApi(() => usersApi.list({ role: "Teacher", pageSize: 100 }), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSubject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<ClassSubject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setModalError(null);
  };

  const handleSubmit = useCallback(
    async (values: ClassSubjectFormValues) => {
      setSubmitting(true);
      setModalError(null);
      try {
        if (editing) {
          await classSubjectsApi.update(editing.id, values);
        } else {
          await classSubjectsApi.create(values);
        }
        setNotice("Teacher assignment saved.");
        closeModal();
        void links.reload();
      } catch (e) {
        setModalError(getErrorMessage(e));
      } finally {
        setSubmitting(false);
      }
    },
    [editing, links],
  );

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await classSubjectsApi.remove(deleting.id);
      setNotice("Teacher assignment removed.");
      setDeleting(null);
      void links.reload();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto  space-y-6">
      <PageHeader
        title="Teacher Assignments"
        description="Link classes and subjects to the teachers who teach them."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Assign teacher
          </Button>
        }
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <Card>
        {links.loading && <Spinner label="Loading teacher assignments..." />}
        {links.error && (
          <div className="p-4">
            <Alert tone="error">{links.error}</Alert>
          </div>
        )}
        {!links.loading && !links.error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {links.data?.length ? (
                  links.data.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-semibold text-gray-900">{link.className}</td>
                      <td className="px-5 py-3 text-gray-600">{link.subjectName}</td>
                      <td className="px-5 py-3 text-gray-600">{link.teacherName}</td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={link.isActive} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditing(link);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeleting(link);
                              setDeleteError(null);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No teacher assignments yet"
                        description="Assign a teacher to a class and subject to enable assignments."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ClassSubjectFormModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        link={editing}
        classes={classes.data ?? []}
        subjects={subjects.data ?? []}
        teachers={teachers.data?.items ?? []}
        submitting={submitting}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove teacher assignment"
        message={`Remove this teacher assignment (${deleting?.className ?? ""} · ${deleting?.subjectName ?? ""})? Teachers will no longer be able to create assignments for this link.`}
        confirmLabel="Remove"
        loading={deleteLoading}
        onClose={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
      />
      {deleteError && <Alert tone="error">{deleteError}</Alert>}
    </div>
  );
}
