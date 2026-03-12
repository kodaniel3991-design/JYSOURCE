import { notFound } from "next/navigation";
import { PODetailClient } from "./po-detail-client";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return <PODetailClient id={id} />;
}
