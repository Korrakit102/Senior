"use server";

import { NextRequest, NextResponse } from "next/server";
import { markRead } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const role = body?.role as string | undefined;
  if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });
  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }
  const ids = Array.isArray(body?.ids) ? body.ids : undefined;
  await markRead(role, ids);
  return NextResponse.json({ ok: true });
}
