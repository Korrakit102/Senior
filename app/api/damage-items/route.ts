"use server";

import { NextRequest, NextResponse } from "next/server";
import { insertDamageItems, listDamageItems } from "@/lib/db";

// ดึง breakdown ความเสียหายรายชิ้นทั้งหมด ใช้แสดงในหน้ารายงาน > ความเสียหาย
export async function GET() {
  const rows = await listDamageItems();
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      itemName: r.item_name,
      code: r.code,
      eventId: r.event_id,
      date: r.event_date,
      qty: r.qty,
      cost: r.cost,
      status: r.status,
    }))
  );
}

// บันทึก breakdown ความเสียหายรายชิ้นของอีเวนต์หนึ่ง เรียกตอน mark เสียหายในหน้าเบิก/คืน
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const eventId = body?.eventId;
  const eventCode = body?.eventCode;
  const eventDate = body?.eventDate;
  const items = body?.items;

  const valid =
    typeof eventId === "string" && eventId.trim().length > 0 &&
    typeof eventCode === "string" &&
    typeof eventDate === "string" &&
    Array.isArray(items) && items.length > 0 &&
    items.every(
      (i) =>
        typeof i?.itemName === "string" && i.itemName.trim().length > 0 &&
        typeof i?.qty === "number" && i.qty > 0 &&
        typeof i?.cost === "number" && i.cost >= 0
    );

  if (!valid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await insertDamageItems({ eventId, eventCode, eventDate, items });
  return NextResponse.json({ ok: true, count: items.length });
}
