"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardWorkspace } from "@/components/dashboard/workspace";
import { getUser, logout } from "@/lib/auth";
import type { User } from "@/types/user";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getUser();

    if (!currentUser || currentUser.role !== "BUYER") {
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
      role="buyer"
      fullName={user.fullName}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    />
  );
}
