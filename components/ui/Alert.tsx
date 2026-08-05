import type { ReactNode } from "react";

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "bg-red-50 text-red-700 ring-red-600/20",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3.5 py-2.5 text-sm font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
