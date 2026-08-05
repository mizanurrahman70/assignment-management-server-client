"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/auth-context";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return <Spinner label="Checking your session..." />;
  }

  return <AppShell>{children}</AppShell>;
}
