import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">TechGarments</h1>
      <p className="text-muted-foreground">AI-Powered Garment Sourcing</p>
      <Link
        href="/login"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Login
      </Link>
    </main>
  );
}
