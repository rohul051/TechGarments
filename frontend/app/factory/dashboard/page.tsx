"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, LogOut, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser, logout } from "@/lib/auth";
import type { User } from "@/types/user";

const stats = [
  { label: "Open RFQs", value: 8, icon: Search },
  { label: "My Quotations", value: 4, icon: FileText },
  { label: "Active Orders", value: 2, icon: Package },
];

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

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold">GarmentLink-AI</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.fullName}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {user.fullName}
          </h1>
        </section>

        <section
          aria-label="Account statistics"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => console.log("Browse RFQs")}>
              <Search />
              Browse RFQs
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log("View Quotations")}
            >
              <ClipboardList />
              View Quotations
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
