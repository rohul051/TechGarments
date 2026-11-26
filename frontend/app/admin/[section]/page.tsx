import { Suspense } from "react";
import { AdminSectionView } from "@/components/admin/AdminSectionView";
import { adminNavigationMeta } from "@/lib/adminNavigation";

export function generateStaticParams() {
  return adminNavigationMeta
    .filter((item) => item.id !== "overview")
    .map((item) => ({ section: item.id }));
}

async function AdminSectionContent({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <AdminSectionView section={section} />;
}

export default function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading section...</div>}>
      <AdminSectionContent params={params} />
    </Suspense>
  );
}
