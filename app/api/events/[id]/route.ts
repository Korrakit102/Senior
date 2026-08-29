"use server";

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  confirmEventPayment,
  deleteEventById,
  getEventById,
  updateEventDecision,
  updateEventEquipment,
  updateEventIssueStatus,
  updateEventPaymentReceipt,
} from "@/lib/db";
import type { EventEquipmentRow } from "@/lib/db";

const MAX_IMAGE_RECEIPT_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_RECEIPT_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const RECEIPT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "receipts");

// อัปโหลดสลิปการชำระเงิน: รับเป็น multipart/form-data แล้วเขียนไฟล์ลงดิสก์
// (ไม่เก็บ base64 ก้อนใหญ่ใน DB เพราะ data URI ที่ยาวเกิน ~2MB เปิดในแท็บใหม่ไม่ได้บนเบราว์เซอร์ตระกูล Chromium)
async function handleUploadReceiptForm(req: NextRequest, id: string) {
  const formData = await req.formData();
  const role = formData.get("role");

  if (role !== "SA") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const current = await getEventById(id);
  if (!current) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "receipt file is required" }, { status: 400 });
  }
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "receipt must be a JPG, PNG, or PDF file" }, { status: 400 });
  }
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_RECEIPT_FILE_SIZE) {
      return NextResponse.json({ error: "receipt PDF file is too large (max 20MB)" }, { status: 400 });
    }
  } else if (file.size > MAX_IMAGE_RECEIPT_FILE_SIZE) {
    return NextResponse.json({ error: "receipt image file is too large (max 5MB)" }, { status: 400 });
  }

  await mkdir(RECEIPT_UPLOAD_DIR, { recursive: true });

  const storedFileName = `${id}-${Date.now()}${path.extname(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(RECEIPT_UPLOAD_DIR, storedFileName), buffer);

  const filePath = `/uploads/receipts/${storedFileName}`;
  const uploadedAt = new Date().toISOString();

  const rowCount = await updateEventPaymentReceipt({
    id,
    fileName: file.name,
    fileType: file.type,
    filePath,
    uploadedAt,
  });

  if (rowCount === 0) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    status: { text: "รอตรวจสอบการชำระเงิน", tone: "pending" },
    paymentReceipt: { fileName: file.name, fileType: file.type, dataUrl: filePath, uploadedAt },
  });
}

function normalizeEquipmentList(value: unknown): EventEquipmentRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<EventEquipmentRow>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const qty = Math.max(0, Math.floor(Number(row.qty) || 0));
      if (!name || qty <= 0) return null;

      return {
        name,
        qty,
        available: Math.max(0, Math.floor(Number(row.available) || 0)),
        category: typeof row.category === "string" ? row.category : "",
        pricePerDayTHB: Math.max(0, Number(row.pricePerDayTHB) || 0),
      };
    })
    .filter((item): item is EventEquipmentRow => item !== null);
}

function mergeEquipment(
  currentEquipment: EventEquipmentRow[],
  incomingEquipment: EventEquipmentRow[]
): EventEquipmentRow[] {
  const byName = new Map<string, EventEquipmentRow>();

  for (const item of currentEquipment) {
    byName.set(item.name, { ...item });
  }

  for (const item of incomingEquipment) {
    const existing = byName.get(item.name);
    if (existing) {
      byName.set(item.name, {
        ...existing,
        qty: existing.qty + item.qty,
        available: existing.available || item.available,
        category: existing.category || item.category,
        pricePerDayTHB: existing.pricePerDayTHB || item.pricePerDayTHB,
      });
    } else {
      byName.set(item.name, { ...item });
    }
  }

  return Array.from(byName.values());
}

function subtractEquipment(
  currentEquipment: EventEquipmentRow[],
  returnedEquipment: EventEquipmentRow[]
): EventEquipmentRow[] {
  const byName = new Map<string, EventEquipmentRow>();

  for (const item of currentEquipment) {
    byName.set(item.name, { ...item });
  }

  for (const item of returnedEquipment) {
    const existing = byName.get(item.name);
    if (!existing) continue;
    const nextQty = Math.max(0, existing.qty - item.qty);
    if (nextQty === 0) {
      byName.delete(item.name);
    } else {
      byName.set(item.name, { ...existing, qty: nextQty });
    }
  }

  return Array.from(byName.values());
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return handleUploadReceiptForm(req, id);
  }

  const body = await req.json().catch(() => null);

  // ─── เพิ่ม/คืนอุปกรณ์แบบด่วน โดยผูกกับ Event ที่เลือก ─────────────────────
  if (body?.quickEquipmentAction) {
    if (!["add", "remove"].includes(body.quickEquipmentAction)) {
      return NextResponse.json({ error: "invalid quickEquipmentAction" }, { status: 400 });
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    const incomingEquipment = normalizeEquipmentList(body.equipment);
    if (incomingEquipment.length === 0) {
      return NextResponse.json({ error: "equipment is required" }, { status: 400 });
    }

    const currentEquipment = Array.isArray(current.equipment) ? current.equipment : [];
    const nextEquipment =
      body.quickEquipmentAction === "add"
        ? mergeEquipment(currentEquipment, incomingEquipment)
        : subtractEquipment(currentEquipment, incomingEquipment);

    const isFullyReturned =
      body.quickEquipmentAction === "remove" && nextEquipment.length === 0;

    const rowCount = await updateEventEquipment({
      id,
      equipment: nextEquipment,
      issueStatus:
        body.quickEquipmentAction === "add"
          ? "inuse"
          : isFullyReturned
            ? "returned"
            : "inuse",
      isDamaged:
        body.quickEquipmentAction === "remove" && body.isDamaged === true
          ? true
          : undefined,
      statusText: isFullyReturned ? "รอชำระเงิน" : undefined,
      statusTone: isFullyReturned ? "pending" : undefined,
    });

    if (rowCount === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      equipment: nextEquipment,
      issueStatus: isFullyReturned ? "returned" : "inuse",
    });
  }

  // ─── ยืนยันการชำระเงิน (อัปโหลดสลิปแยกไปที่ multipart branch ด้านบนแล้ว) ─────
  if (body?.paymentAction) {
    if (body.paymentAction !== "confirmPayment") {
      return NextResponse.json({ error: "invalid paymentAction" }, { status: 400 });
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    if (body.role !== "Manager") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (!current.receipt_data_url && !current.receipt_file_path) {
      return NextResponse.json({ error: "receipt is required" }, { status: 400 });
    }

    const rowCount = await confirmEventPayment(id);
    if (rowCount === 0) {
      return NextResponse.json({ error: "payment cannot be confirmed" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: { text: "เสร็จสิ้น", tone: "progress" },
    });
  }

  // ─── อัปเดต issueStatus (inuse / returned / ready) ─────────────────────────
  if (body?.issueStatus) {
    if (!["ready", "inuse", "returned"].includes(body.issueStatus)) {
      return NextResponse.json({ error: "invalid issueStatus" }, { status: 400 });
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    const isDamaged = body.issueStatus === "returned" ? body.isDamaged === true : false;
    const rowCount = await updateEventIssueStatus(id, body.issueStatus, isDamaged);
    if (rowCount === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  // ─── อนุมัติ / ไม่อนุมัติ Event (ต้องมี startDate, endDate, equipment) ─────────
  if (!body?.startDate || !body?.endDate || !Array.isArray(body?.equipment) || !body?.decision) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const decision = body.decision === "approved" ? "approved" : "rejected";
  const rowCount = await updateEventDecision({
    id,
    startDate: body.startDate,
    endDate: body.endDate,
    itemsCount: body.equipment.length,
    statusText: decision === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ",
    statusTone: decision === "approved" ? "success" : "rejected",
    equipment: body.equipment,
  });

  if (rowCount === 0) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const rowCount = await deleteEventById(id);
  if (rowCount === 0) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
