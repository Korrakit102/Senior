"use server";

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { insertDamageItems, listDamageItems } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

const MAX_PHOTO_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png"];
const DAMAGE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "damage");

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
      billedCost: r.billed_cost,
      resolvedCodes: r.resolved_codes,
      status: r.status,
      photoPaths: r.photo_paths ?? [],
      note: r.note,
    }))
  );
}

// บันทึก breakdown ความเสียหายรายชิ้นของอีเวนต์หนึ่ง เรียกตอน mark เสียหายในหน้าเบิก/คืน
// รับเป็น multipart/form-data เพื่อแนบรูปหลักฐานความเสียหายไปด้วย แล้วเขียนไฟล์ลงดิสก์
// (pattern เดียวกับ handleUploadReceiptForm ใน app/api/events/[id]/route.ts)
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const eventId = formData.get("eventId");
  const eventCode = formData.get("eventCode");
  const eventDate = formData.get("eventDate");

  let items: Array<{ itemName: string; qty: number; cost: number }>;
  let photoCounts: number[];
  try {
    items = JSON.parse(String(formData.get("items")));
    const photoCountsRaw = formData.get("photoCounts");
    photoCounts = photoCountsRaw ? JSON.parse(String(photoCountsRaw)) : items.map(() => 0);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

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
    ) &&
    Array.isArray(photoCounts) && photoCounts.length === items.length &&
    photoCounts.every((n) => typeof n === "number" && n >= 0);

  if (!valid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (containsNullByte({ eventId, eventCode, eventDate, items })) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const totalExpectedPhotos = photoCounts.reduce((sum, n) => sum + n, 0);
  if (photoFiles.length !== totalExpectedPhotos) {
    return NextResponse.json({ error: "photo count mismatch" }, { status: 400 });
  }

  for (const file of photoFiles) {
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "photo must be a JPG or PNG file" }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_FILE_SIZE) {
      return NextResponse.json({ error: "photo file is too large (max 5MB)" }, { status: 400 });
    }
    // นามสกุลไฟล์ถูกใช้เป็น path บนดิสก์และเก็บลง photo_paths — เช็คก่อนเขียนไฟล์ใดๆ
    if (containsNullByte(file.name)) {
      return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
    }
  }

  if (photoFiles.length > 0) {
    await mkdir(DAMAGE_UPLOAD_DIR, { recursive: true });
  }

  const photoPathsByItem: string[][] = [];
  let cursor = 0;
  let globalIndex = 0;
  for (const count of photoCounts) {
    const paths: string[] = [];
    for (let i = 0; i < count; i++) {
      const file = photoFiles[cursor++];
      const storedFileName = `${eventId}-${globalIndex}-${Date.now()}${path.extname(file.name)}`;
      globalIndex++;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(DAMAGE_UPLOAD_DIR, storedFileName), buffer);
      paths.push(`/uploads/damage/${storedFileName}`);
    }
    photoPathsByItem.push(paths);
  }

  await insertDamageItems({
    eventId,
    eventCode,
    eventDate,
    items: items.map((item, idx) => ({ ...item, photoPaths: photoPathsByItem[idx] ?? [] })),
  });

  return NextResponse.json({ ok: true, count: items.length });
}
