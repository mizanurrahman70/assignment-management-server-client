"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/auth-context";
import type { Assignment, ClassSubject, User } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  classId: z.number({ message: "Select a class" }),
  subjectId: z.number({ message: "Select a subject" }),
  teacherId: z.number({ message: "Select a teacher" }),
  maxMarks: z
    .number({ message: "Max marks is required" })
    .int("Marks must be a whole number")
    .positive("Max marks must be greater than 0")
    .max(1000, "Max marks seems too high"),
  deadline: z.string().min(1, "Deadline is required"),
});

export type AssignmentFormValues = z.infer<typeof schema>;

function toLocalInput(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toLocalInput(date.toISOString());
}
interface Props {
  mode: "create" | "edit";
  assignment: Assignment | null;
  links: ClassSubject[];
  teachers: User[];
  submitting: boolean;
  error: string | null;
  onSubmit: (values: AssignmentFormValues) => void;
}

export function AssignmentForm({
  mode,
  assignment,
  links,
  teachers,
  submitting,
  error,
  onSubmit,
}: Props) {
  const { user } = useAuth();
  const isEdit = mode === "edit";

  const activeLinks = useMemo(() => links.filter((l) => l.isActive), [links]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      classId: undefined,
      subjectId: undefined,
      teacherId: undefined,
      maxMarks: 100,
      deadline: defaultDeadline(),
    },
  });

  const selectedClassId = watch("classId");
  const selectedSubjectId = watch("subjectId");

  const subjectOptions = useMemo(() => {
    const pairs = activeLinks.filter((l) => l.classId === selectedClassId);
    const seen = new Set<number>();
    return pairs.filter((l) => {
      if (seen.has(l.subjectId)) return false;
      seen.add(l.subjectId);
      return true;
    });
  }, [activeLinks, selectedClassId]);

  const selectedLink = useMemo(
    () =>
      activeLinks.find(
        (l) => l.classId === selectedClassId && l.subjectId === selectedSubjectId,
      ),
    [activeLinks, selectedClassId, selectedSubjectId],
  );

  useEffect(() => {
    if (selectedLink?.teacherId != null && !isEdit) {
      setValue("teacherId", selectedLink.teacherId, { shouldValidate: true });
    }
  }, [selectedLink, setValue, isEdit]);

  useEffect(() => {
    if (!assignment) return;
    reset({
      title: assignment.title,
      description: assignment.description,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      teacherId: assignment.teacherId,
      maxMarks: assignment.maxMarks,
      deadline: toLocalInput(assignment.deadline),
    });
  }, [assignment, reset]);

  const isTeacher = user?.role === "Teacher";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && <Alert tone="error">{error}</Alert>}

      <Field label="Title" htmlFor="a-title" error={errors.title?.message}>
        <Input
          id="a-title"
          placeholder="e.g. Algebra Homework: Linear Equations"
          hasError={Boolean(errors.title)}
          {...register("title")}
        />
      </Field>

      <Field label="Description" htmlFor="a-desc" error={errors.description?.message}>
        <Textarea
          id="a-desc"
          rows={5}
          placeholder="Instructions, resources, expectations…"
          hasError={Boolean(errors.description)}
          {...register("description")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class" htmlFor="a-class" error={errors.classId?.message}>
          <Select
            id="a-class"
            hasError={Boolean(errors.classId)}
            disabled={isEdit}
            {...register("classId", { valueAsNumber: true })}
          >
            <option value="">Select a class…</option>
            {activeLinks
              .filter((l, i, arr) => arr.findIndex((x) => x.classId === l.classId) === i)
              .map((l) => (
                <option key={l.classId} value={l.classId}>
                  {l.className}
                </option>
              ))}
          </Select>
        </Field>

        <Field label="Subject" htmlFor="a-subject" error={errors.subjectId?.message}>
          <Select
            id="a-subject"
            hasError={Boolean(errors.subjectId)}
            disabled={isEdit || !selectedClassId}
            {...register("subjectId", { valueAsNumber: true })}
          >
            <option value="">{selectedClassId ? "Select a subject…" : "Select a class first"}</option>
            {subjectOptions.map((l) => (
              <option key={l.subjectId} value={l.subjectId}>
                {l.subjectName}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isTeacher ? (
        <input type="hidden" {...register("teacherId", { valueAsNumber: true })} />
      ) : (
        <Field label="Teacher" htmlFor="a-teacher" error={errors.teacherId?.message}>
          <Select
            id="a-teacher"
            hasError={Boolean(errors.teacherId)}
            disabled={isEdit}
            {...register("teacherId", { valueAsNumber: true })}
          >
            <option value="">{isEdit ? "Assigned teacher" : "Select a teacher…"}</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Max marks"
          htmlFor="a-marks"
          error={errors.maxMarks?.message}
        >
          <Input
            id="a-marks"
            type="number"
            min="1"
            placeholder="100"
            hasError={Boolean(errors.maxMarks)}
            {...register("maxMarks", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Deadline"
          htmlFor="a-deadline"
          error={errors.deadline?.message}
          hint={isEdit ? "Must be in the future." : undefined}
        >
          <Input
            id="a-deadline"
            type="datetime-local"
            hasError={Boolean(errors.deadline)}
            {...register("deadline")}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
        <Button type="submit" loading={submitting}>
          {isEdit ? "Save changes" : "Create assignment"}
        </Button>
      </div>
    </form>
  );
}
