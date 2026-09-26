"use server";

import { NextRequest, NextResponse } from "next/server";
import { insertEquipmentHistory, listEquipmentHistoryByEvent } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

// ─── GET: ดึงประวัติการแก้ไขอุปกรณ์ของ Event ─────────────────────────────
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rows = await listEquipmentHistoryByEvent(id);
  return NextResponse.json(rows);
}

// ─── POST: บันทึกประวัติการแก้ไขอุปกรณ์ ──────────────────────────────────
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);

  if (!body?.action || !body?.equipmentName || typeof body?.qty !== "number") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (!["เพิ่ม", "ลบ"].includes(body.action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  await insertEquipmentHistory({
    id: `EH-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    eventId: id,
    action: body.action,
    equipmentName: body.equipmentName,
    qty: body.qty,
    changedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
