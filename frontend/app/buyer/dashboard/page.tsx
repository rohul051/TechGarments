"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardWorkspace } from "@/components/dashboard/workspace";
import { getUser, logout, restoreUserFromFirebase } from "@/lib/auth";
import type { User } from "@/types/user";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    async function initializeDashboard() {
      const storedUser = getUser();
      const currentUser = !storedUser || storedUser.role !== "BUYER"
        ? (await restoreUserFromFirebase()) ?? storedUser
        : storedUser;
      if (!active) return;
      if (!currentUser || currentUser.role !== "BUYER") {
        router.replace("/login");
        return;
      }
      queueMicrotask(() => {
        if (active) setUser(currentUser);
      });
    }

    void initializeDashboard().catch((error: unknown) => {
      console.error("[Buyer dashboard] Failed to restore the user session:", error);
      if (active) router.replace("/login");
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
      userId={user.id}
      userEmail={user.email}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    />
  );
}
