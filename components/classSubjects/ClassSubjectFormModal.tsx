"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { ClassSubject, SchoolClass, Subject, User } from "@/lib/types";

const schema = z.object({
  classId: z.number({ message: "Select a class" }),
  subjectId: z.number({ message: "Select a subject" }),
  teacherId: z.number({ message: "Select a teacher" }),
  isActive: z.boolean(),
});

export type ClassSubjectFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  mode: "create" | "edit";
  link: ClassSubject | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: User[];
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ClassSubjectFormValues) => void;
}

export function ClassSubjectFormModal({
  open,
  mode,
  link,
  classes,
  subjects,
  teachers,
  submitting,
  error,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = mode === "edit";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassSubjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { classId: undefined, subjectId: undefined, teacherId: undefined, isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      link
        ? {
            classId: link.classId,
            subjectId: link.subjectId,
            teacherId: link.teacherId ?? undefined,
            isActive: link.isActive,
          }
        : { classId: undefined, subjectId: undefined, teacherId: undefined, isActive: true },
    );
  }, [open, link, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit teacher assignment" : "Assign a teacher"}
      description={
        isEdit
          ? "Re-assign the teacher or toggle this link."
          : "Link a class and subject to the teacher who teaches it."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="cs-form" loading={submitting}>
            {isEdit ? "Save changes" : "Assign"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <form id="cs-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Class" htmlFor="cs-class" error={errors.classId?.message}>
          <Select
            id="cs-class"
            hasError={Boolean(errors.classId)}
            disabled={isEdit}
            {...register("classId", { valueAsNumber: true })}
          >
            <option value="">Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subject" htmlFor="cs-subject" error={errors.subjectId?.message}>
          <Select
            id="cs-subject"
            hasError={Boolean(errors.subjectId)}
            disabled={isEdit}
            {...register("subjectId", { valueAsNumber: true })}
          >
            <option value="">Select a subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Teacher" htmlFor="cs-teacher" error={errors.teacherId?.message}>
          <Select
            id="cs-teacher"
            hasError={Boolean(errors.teacherId)}
            {...register("teacherId", { valueAsNumber: true })}
          >
            <option value="">Select a teacher…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} ({t.email})
              </option>
            ))}
          </Select>
        </Field>
        {isEdit && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              {...register("isActive")}
            />
            <span className="text-sm text-gray-700">
              Active link (teachers can create assignments for it)
            </span>
          </label>
        )}
      </form>
    </Modal>
  );
}
