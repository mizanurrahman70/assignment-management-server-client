"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApi } from "@/lib/useApi";
import { getErrorMessage, formatDateShort } from "@/lib/utils";

interface CatalogItem {
  id: number;
  name: string;
  code: string;
  createdAt?: string;
}

interface CatalogService {
  list: () => Promise<CatalogItem[]>;
  create: (data: { name: string; code: string }) => Promise<CatalogItem>;
  update: (id: number, data: { name: string; code: string }) => Promise<CatalogItem>;
  remove: (id: number) => Promise<void>;
}

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, - or _"),
});

type FormValues = z.infer<typeof schema>;

function ItemFormModal({
  open,
  mode,
  item,
  title,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  item: CatalogItem | null;
  title: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}) {
  const isEdit = mode === "edit";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(item ? { name: item.name, code: item.code } : { name: "", code: "" });
  }, [open, item, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="catalog-form" loading={submitting}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <form id="catalog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Name" htmlFor="cat-name" error={errors.name?.message}>
          <Input id="cat-name" hasError={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field
          label="Code"
          htmlFor="cat-code"
          error={errors.code?.message}
          hint="A short, unique code (e.g. G10A or MATH)."
        >
          <Input
            id="cat-code"
            className="uppercase"
            hasError={Boolean(errors.code)}
            {...register("code")}
          />
        </Field>
      </form>
    </Modal>
  );
}

export function CatalogPage({
  title,
  description,
  singular,
  service,
}: {
  title: string;
  description: string;
  singular: string;
  service: CatalogService;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: items,
    loading,
    error,
    reload: load,
  } = useApi(() => service.list(), [service]);

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

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setModalError(null);
    try {
      if (editing) {
        await service.update(editing.id, values);
      } else {
        await service.create(values);
      }
      setNotice(`${singular} saved.`);
      closeModal();
      void load();
    } catch (e) {
      setModalError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await service.remove(deleting.id);
      setNotice(`${singular} deleted.`);
      setDeleting(null);
      void load();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add {singular.toLowerCase()}
          </Button>
        }
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <Card>
        {loading && <Spinner label={`Loading ${title.toLowerCase()}...`} />}
        {error && (
          <div className="p-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items && items.length ? (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-700">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDateShort(item.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditing(item);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeleting(item);
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
                    <td colSpan={4}>
                      <EmptyState
                        title={`No ${title.toLowerCase()} yet`}
                        description={`Add your first ${singular.toLowerCase()} to get started.`}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ItemFormModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        item={editing}
        title={singular}
        submitting={submitting}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${singular.toLowerCase()}`}
        message={`Are you sure you want to delete ${deleting?.name ?? ""}? Items linked to assignments or records cannot be deleted.`}
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
