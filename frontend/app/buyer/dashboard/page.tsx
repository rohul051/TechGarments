"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LogOut, Package, Search, Users } from "lucide-react";
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
  { label: "Active RFQs", value: 5, icon: FileText },
  { label: "Quotations", value: 12, icon: Users },
  { label: "Orders", value: 3, icon: Package },
];

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
            <Button onClick={() => console.log("Create New RFQ")}>
              <FileText />
              Create New RFQ
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log("Browse Factories")}
            >
              <Search />
              Browse Factories
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
