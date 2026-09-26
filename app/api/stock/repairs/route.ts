"use server";

import { NextRequest, NextResponse } from "next/server";
import { listRepairingHistoryByStockId, resolveRepairingStock } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

// ดึงประวัติการแจ้งซ่อมของอุปกรณ์ตัวเดียว ใช้แสดงใน StockDetailModal
export async function GET(req: NextRequest) {
  const equipmentId = req.nextUrl.searchParams.get("equipmentId");
  if (!equipmentId) {
    return NextResponse.json({ error: "equipmentId is required" }, { status: 400 });
  }

  const rows = await listRepairingHistoryByStockId(equipmentId);
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      stockId: r.stock_id,
      stockCode: r.stock_code,
      stockName: r.stock_name,
      quantity: r.quantity,
      eventId: r.event_id,
      createdAt: r.created_at,
    }))
  );
}

// คืน (ซ่อมเสร็จ กลับเป็นพร้อมใช้) หรือจำหน่ายทิ้งถาวร (ซ่อมไม่ได้) จากล็อตที่ระบุใน damage_items โดยตรง
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const damageItemId = body?.damageItemId;
  const quantity = body?.quantity;
  const action = body?.action;
  const equipmentCodes = typeof body?.equipmentCodes === "string"
    ? body.equipmentCodes.trim()
    : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";

  const valid =
    typeof damageItemId === "string" && damageItemId.trim().length > 0 &&
    typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0 &&
    (action === "return" || action === "dispose") &&
    equipmentCodes.length > 0 &&
    equipmentCodes.length <= 5000;

  if (!valid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (containsNullByte({ equipmentCodes, note })) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  try {
    const updated = await resolveRepairingStock({
      damageItemId,
      quantity,
      action,
      equipmentCodes,
      note: note || undefined,
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        brand: updated.brand,
        category: updated.category,
        system: updated.system,
        zone: updated.zone,
        warehouseAddress: updated.warehouse_address ?? "",
        status: updated.status,
        qty: updated.qty,
        available: updated.available,
        pricePerDay: updated.price_per_day,
        cost: updated.cost,
        repairing: updated.repairing,
      },
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "stock item not found" || err.message === "damage lot not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof Error && (err.message === "invalid quantity" || err.message === "damage lot already resolved" || err.message === "equipment codes required")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "failed to resolve repairing stock" }, { status: 500 });
  }
}
