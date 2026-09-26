"use server";

import { NextRequest, NextResponse } from "next/server";
import { adjustStock, listStockItems, upsertStockItems } from "@/lib/db";
import type { StockRowDb } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

type StockApiRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  warehouseAddress?: string;
  status: string;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
  repairing: number;
};

function mapFromDb(row: StockRowDb): StockApiRow {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    brand: row.brand,
    category: row.category,
    system: row.system,
    zone: row.zone,
    warehouseAddress: row.warehouse_address ?? "",
    status: row.status,
    qty: row.qty,
    available: row.available,
    pricePerDay: row.price_per_day,
    cost: row.cost,
    repairing: row.repairing,
  };
}

export async function GET() {
  const rows = await listStockItems();
  return NextResponse.json(rows.map(mapFromDb));
}

// Full stock sync from the management page (add / edit / delete items)
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.items)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const items = body.items as StockApiRow[];
  const valid = items.every(
    (it) =>
      it?.id && it?.code && it?.name && it?.brand && it?.category &&
      it?.system && it?.zone && it?.status &&
      (it?.warehouseAddress === undefined || typeof it.warehouseAddress === "string") &&
      typeof it?.qty === "number" &&
      typeof it?.available === "number" &&
      typeof it?.pricePerDay === "number" &&
      typeof it?.cost === "number" &&
      typeof it?.repairing === "number"
  );
  if (!valid) {
    return NextResponse.json({ error: "invalid stock items" }, { status: 400 });
  }

  if (containsNullByte(items)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  try {
    await upsertStockItems(items);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err.code === "23001" || err.code === "23503")) {
      return NextResponse.json(
        { error: "ไม่สามารถลบอุปกรณ์นี้ออกจากสต็อกได้ เพราะมีประวัติการรับเข้า/ประวัติการเปลี่ยนแปลงผูกอยู่" },
        { status: 409 }
      );
    }
    throw err;
  }
  return NextResponse.json({ ok: true, count: items.length });
}

// Atomic stock adjustment triggered by event approve / issue / return / damage
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;
  if (!["deduct", "return", "damage"].includes(action ?? "")) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  if (!Array.isArray(body?.items)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const items = body.items as Array<{ name: string; qty: number }>;
  const valid = items.every(
    (i) => typeof i?.name === "string" && typeof i?.qty === "number"
  );
  if (!valid) {
    return NextResponse.json({ error: "invalid items" }, { status: 400 });
  }

  if (containsNullByte(items)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const eventId = typeof body?.eventId === "string" ? body.eventId : undefined;

  const updated = await adjustStock(items, action as "deduct" | "return" | "damage", eventId);
  return NextResponse.json({ items: updated.map(mapFromDb) });
}
