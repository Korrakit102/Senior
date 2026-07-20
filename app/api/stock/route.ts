"use server";

import { NextRequest, NextResponse } from "next/server";
import { adjustStock, listStockItems, upsertStockItems } from "@/lib/db";
import type { StockRowDb } from "@/lib/db";

type StockApiRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  status: string;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
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
    status: row.status,
    qty: row.qty,
    available: row.available,
    pricePerDay: row.price_per_day,
    cost: row.cost,
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
      typeof it?.qty === "number" &&
      typeof it?.available === "number" &&
      typeof it?.pricePerDay === "number" &&
      typeof it?.cost === "number"
  );
  if (!valid) {
    return NextResponse.json({ error: "invalid stock items" }, { status: 400 });
  }

  await upsertStockItems(items);
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

  const updated = await adjustStock(items, action as "deduct" | "return" | "damage");
  return NextResponse.json({ items: updated.map(mapFromDb) });
}
