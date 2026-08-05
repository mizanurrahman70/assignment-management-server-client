"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleBadge, ActiveBadge } from "@/components/ui/Badges";
import { UserFormModal, type UserFormValues } from "@/components/users/UserFormModal";
import { useApi } from "@/lib/useApi";
import { classesApi, usersApi } from "@/lib/services";
import type { User } from "@/lib/types";
import { fullName, getErrorMessage, formatDateShort } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);

  const users = useApi(
    () =>
      usersApi.list({
        search: search || undefined,
        role: roleFilter || undefined,
        classId: classFilter ? Number(classFilter) : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [search, roleFilter, classFilter, page],
  );
  const classes = useApi(() => classesApi.list(), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setModalError(null);
  };

  const handleSubmit = useCallback(
    async (values: UserFormValues) => {
      setSubmitting(true);
      setModalError(null);
      try {
        const role = editing?.role ?? values.role ?? "Student";
        const classId = role === "Student" && values.classId ? values.classId : null;
        if (editing) {
          await usersApi.update(editing.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            classId,
            isActive: editing.isActive,
          });
        } else {
          await usersApi.create({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password ?? "",
            role,
            classId,
          });
        }
        setNotice(editing ? "User updated." : "User created.");
        closeModal();
        void users.reload();
      } catch (e) {
        setModalError(getErrorMessage(e));
      } finally {
        setSubmitting(false);
      }
    },
    [editing, users],
  );

  const toggleStatus = async (user: User) => {
    try {
      await usersApi.setStatus(user.id, !user.isActive);
      setNotice(`${fullName(user)} ${user.isActive ? "deactivated" : "activated"}.`);
      void users.reload();
    } catch (e) {
      setNotice(getErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await usersApi.remove(deleting.id);
      setNotice("User deleted.");
      setDeleting(null);
      void users.reload();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Users"
        description="Manage admin, teacher and student accounts."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add user
          </Button>
        }
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
            aria-label="Search users"
          />
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-[10rem]"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </Select>
          <Select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
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
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.loading && (
                <tr>
                  <td colSpan={7}>
                    <Spinner label="Loading users..." />
                  </td>
                </tr>
              )}
              {users.error && (
                <tr>
                  <td colSpan={7} className="px-5 py-4">
                    <Alert tone="error">{users.error}</Alert>
                  </td>
                </tr>
              )}
              {!users.loading &&
                !users.error &&
                (users.data?.items.length ? (
                  users.data.items.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </span>
                          <span className="font-semibold text-gray-900">{fullName(user)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{user.email}</td>
                      <td className="px-5 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-3 text-gray-600">{user.className ?? "—"}</td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={user.isActive} />
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDateShort(user.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditing(user);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={user.isActive ? "ghost" : "success"}
                            size="sm"
                            onClick={() => toggleStatus(user)}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeleting(user);
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
                    <td colSpan={7}>
                      <EmptyState
                        title="No users found"
                        description="Try adjusting your search or filters."
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {users.data && users.data.totalPages > 1 && (
          <Pagination
            page={users.data.page}
            totalPages={users.data.totalPages}
            totalCount={users.data.totalCount}
            onPageChange={setPage}
          />
        )}
      </Card>

      <UserFormModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        user={editing}
        classes={classes.data ?? []}
        submitting={submitting}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user"
        message={`Are you sure you want to delete ${deleting ? fullName(deleting) : ""}? This cannot be undone. Users with related records cannot be deleted.`}
        confirmLabel="Delete"
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
