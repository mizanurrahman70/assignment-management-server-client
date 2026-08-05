"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RoleBadge } from "@/components/ui/Badges";
import type { Role, SchoolClass, User } from "@/lib/types";

const baseSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["Admin", "Teacher", "Student"]),
  password: z.string().optional(),
  classId: z.number({ message: "Select a class" }).optional(),
});

const createSchema = baseSchema
  .refine((data) => (data.password ?? "").length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["password"],
  })
  .refine((data) => data.role !== "Student" || data.classId != null, {
    message: "A class is required for students",
    path: ["classId"],
  });

const editSchema = baseSchema.omit({ password: true });

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role?: Role;
  password?: string;
  classId?: number;
}

type CreateValues = z.infer<typeof createSchema>;

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  user: User | null;
  classes: SchoolClass[];
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

export function UserFormModal({
  open,
  mode,
  user,
  classes,
  submitting,
  error,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
  });

  const role = watch("role") ?? user?.role ?? "Student";

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            classId: user.classId ?? undefined,
          }
        : {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "Student",
            classId: undefined,
          },
    );
  }, [open, user, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit user" : "Add user"}
      description={
        isEdit
          ? `Update ${user?.firstName} ${user?.lastName}'s details.`
          : "Create an admin, teacher or student account."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={submitting}>
            {isEdit ? "Save changes" : "Create user"}
          </Button>
        </>
      }
    >
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="uf-first" error={errors.firstName?.message}>
            <Input id="uf-first" hasError={Boolean(errors.firstName)} {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="uf-last" error={errors.lastName?.message}>
            <Input id="uf-last" hasError={Boolean(errors.lastName)} {...register("lastName")} />
          </Field>
        </div>
        <Field label="Email" htmlFor="uf-email" error={errors.email?.message}>
          <Input
            id="uf-email"
            type="email"
            autoComplete="off"
            hasError={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
        {isEdit ? (
          <>
            <input type="hidden" {...register("role")} />
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 ring-1 ring-inset ring-gray-200">
              <span className="text-sm font-medium text-gray-700">Role</span>
              <RoleBadge role={user?.role ?? "Student"} />
            </div>
          </>
        ) : (
          <Field label="Role" htmlFor="uf-role" error={errors.role?.message}>
            <Select id="uf-role" {...register("role")}>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Admin">Admin</option>
            </Select>
          </Field>
        )}
        {!isEdit && (
          <Field
            label="Password"
            htmlFor="uf-password"
            error={errors.password?.message}
            hint="At least 8 characters."
          >
            <Input
              id="uf-password"
              type="password"
              autoComplete="new-password"
              hasError={Boolean(errors.password)}
              {...register("password")}
            />
          </Field>
        )}
        {role === "Student" && (
          <Field
            label="Class"
            htmlFor="uf-class"
            error={errors.classId?.message}
            hint="Students see assignments published for this class."
          >
            <Select
              id="uf-class"
              hasError={Boolean(errors.classId)}
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
        )}
      </form>
    </Modal>
  );
}
