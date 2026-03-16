import { NextResponse } from "next/server";
import { getPurchaseOrderById } from "@/lib/mock/purchase-orders";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const po = getPurchaseOrderById(params.id);
  if (!po) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: po });
}
