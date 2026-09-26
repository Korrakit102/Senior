"use server";

import { NextRequest, NextResponse } from "next/server";
import { getSettings, upsertSettings } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/components/features/settings/constants";
import { containsNullByte } from "@/lib/sanitize";

export async function GET() {
  const data = await getSettings();
  return NextResponse.json(data ?? DEFAULT_SETTINGS);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.company || !body?.banking) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }
  await upsertSettings(body);
  return NextResponse.json({ ok: true });
}
