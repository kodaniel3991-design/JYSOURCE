import { NextResponse } from "next/server";
import { storageLocations } from "@/lib/mock/storage-locations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const warehouseCode = searchParams.get("warehouseCode") ?? "";

  const items = warehouseCode
    ? storageLocations.filter((loc) => loc.WarehouseCode === warehouseCode)
    : storageLocations;

  return NextResponse.json({ ok: true, items });
}
