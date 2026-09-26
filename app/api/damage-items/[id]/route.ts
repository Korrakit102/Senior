"use server";

import { NextRequest, NextResponse } from "next/server";
import { updateDamageItemAmounts } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

// แก้ไข "มูลค่าความเสียหาย" และ "มูลค่าเรียกเก็บ" ของรายการความเสียหายหนึ่งแถว
// เรียกจาก modal แก้ไขในหน้ารายงาน > ความเสียหาย
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);

  const eventId = body?.eventId;
  const itemName = body?.itemName;
  const cost = body?.cost;
  const billedCost = body?.billedCost;

  const valid =
    typeof eventId === "string" && eventId.trim().length > 0 &&
    typeof itemName === "string" && itemName.trim().length > 0 &&
    typeof cost === "number" && cost >= 0 &&
    typeof billedCost === "number" && billedCost >= 0;

  if (!valid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (containsNullByte({ eventId, itemName })) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const updated = await updateDamageItemAmounts({ id, eventId, itemName, cost, billedCost });
  if (!updated) {
    return NextResponse.json({ error: "damage item not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    id: updated.id,
    cost: updated.cost,
    billedCost: updated.billed_cost,
  });
}
