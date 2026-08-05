import { Badge } from "./Badge";
import { roleStyles, statusStyles } from "@/lib/utils";
import type { Role, SubmissionStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge className={statusStyles[status]}>{status}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge className={roleStyles[role]}>{role}</Badge>;
}

export function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Published</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 ring-gray-500/20">Draft</Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Active</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 ring-gray-500/20">Inactive</Badge>
  );
}
