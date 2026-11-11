"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardWorkspace } from "@/components/dashboard/workspace";
import { getUser, logout } from "@/lib/auth";
import type { User } from "@/types/user";

export default function FactoryDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getUser();

    if (!currentUser || currentUser.role !== "FACTORY") {
      router.replace("/login");
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) setUser(currentUser);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (!user) return null;

  return (
    <DashboardWorkspace
      role="factory"
      fullName={user.fullName}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    />
  );
}
