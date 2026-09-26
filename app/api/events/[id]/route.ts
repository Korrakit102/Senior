"use server";

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  confirmEventPayment,
  deleteEventById,
  getEventById,
  issueEquipmentAtomic,
  returnEquipmentQuickAtomic,
  returnEventFullAtomic,
  updateEventDecision,
  updateEventIssueStatus,
  updateEventPaymentReceipt,
  updateEventWorkOrderSalesTargets,
} from "@/lib/db";
import type { EventEquipmentRow, StockRowDb, StockShortage, WorkOrderSalesTargets } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

function mapStockForResponse(rows: StockRowDb[]) {
  return rows.map((r) => ({
    id: r.id,
    qty: r.qty,
    available: r.available,
    status: r.status,
    repairing: r.repairing,
  }));
}

function normalizeItemList(value: unknown): Array<{ name: string; qty: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { name?: unknown; qty?: unknown };
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const qty = Math.max(0, Math.floor(Number(row.qty) || 0));
      if (!name || qty <= 0) return null;
      return { name, qty };
    })
    .filter((item): item is { name: string; qty: number } => item !== null);
}

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
  // ชื่อไฟล์ถูกเก็บลง DB และนามสกุลถูกใช้เป็น path บนดิสก์ — ต้องเช็คก่อนเขียนไฟล์ ไม่งั้นเหลือไฟล์ค้างตอน DB error
  if (containsNullByte(file.name)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
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

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

// ตรวจรูปแบบเป้ายอดขายก่อนบันทึก: ต้องส่งมาครบทั้ง rows / totals / carModelOptions และชนิดถูกต้อง
// (ถ้าไม่ตรวจ ค่าผิดชนิด เช่น string หรือ totals ที่ไม่ใช่ object จะถูก normalize เป็นค่าว่างแล้วเขียนทับข้อมูลเดิมเงียบๆ)
function isValidWorkOrderSalesTargets(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  const { rows, totals, carModelOptions } = value;

  if (!Array.isArray(rows)) return false;
  const rowFields = ["id", "displayModel", "displayQty", "testDriveModel", "testDriveQty"];
  if (!rows.every((row) => isPlainObject(row) && rowFields.every((key) => isOptionalString(row[key])))) {
    return false;
  }

  if (!isPlainObject(totals)) return false;
  if (!isOptionalString(totals.bookingTarget) || !isOptionalString(totals.interestedTarget)) return false;

  return Array.isArray(carModelOptions) && carModelOptions.every((option) => typeof option === "string");
}

function normalizeWorkOrderSalesTargets(value: unknown): WorkOrderSalesTargets {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};

  const rowsSource = Array.isArray(source.rows) ? source.rows : [];
  const rows = rowsSource
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = textValue(row.id) || `sales-target-${index + 1}`;

      return {
        id,
        displayModel: textValue(row.displayModel),
        displayQty: textValue(row.displayQty),
        testDriveModel: textValue(row.testDriveModel),
        testDriveQty: textValue(row.testDriveQty),
      };
    })
    .filter((row): row is WorkOrderSalesTargets["rows"][number] => row !== null);

  const totalsSource =
    source.totals && typeof source.totals === "object"
      ? source.totals as Record<string, unknown>
      : {};

  const carModelOptions = Array.isArray(source.carModelOptions)
    ? Array.from(new Set(source.carModelOptions.map(textValue).filter(Boolean)))
    : [];

  return {
    rows,
    totals: {
      bookingTarget: textValue(totalsSource.bookingTarget),
      interestedTarget: textValue(totalsSource.interestedTarget),
    },
    carModelOptions,
  };
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return handleUploadReceiptForm(req, id);
  }

  const body = await req.json().catch(() => null);

  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  if (body?.workOrderSalesTargets !== undefined) {
    if (!isValidWorkOrderSalesTargets(body.workOrderSalesTargets)) {
      return NextResponse.json({ error: "invalid workOrderSalesTargets" }, { status: 400 });
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    const workOrderSalesTargets = normalizeWorkOrderSalesTargets(body.workOrderSalesTargets);
    const rowCount = await updateEventWorkOrderSalesTargets({
      id,
      workOrderSalesTargets,
    });

    if (rowCount === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, workOrderSalesTargets });
  }

  // ─── เพิ่ม/คืนอุปกรณ์แบบด่วน โดยผูกกับ Event ที่เลือก ─────────────────────
  // อัปเดต equipment ของ Event + ปรับสต็อกจริง ในธุรกรรมเดียวกันที่ backend (กันปัญหา
  // Event บอกว่าเบิก/คืนแล้วแต่ตัวเลขสต็อกไม่ตรงตาม ถ้าเรียกเป็น 2 endpoint แยกแล้วอันใดอันหนึ่งพลาด)
  if (body?.quickEquipmentAction) {
    if (!["add", "remove"].includes(body.quickEquipmentAction)) {
      return NextResponse.json({ error: "invalid quickEquipmentAction" }, { status: 400 });
    }

    const incomingEquipment = normalizeEquipmentList(body.equipment);
    if (incomingEquipment.length === 0) {
      return NextResponse.json({ error: "equipment is required" }, { status: 400 });
    }

    try {
      if (body.quickEquipmentAction === "add") {
        const result = await issueEquipmentAtomic({ id, incomingEquipment });
        return NextResponse.json({
          ok: true,
          equipment: result.equipment,
          issueStatus: "inuse",
          stock: mapStockForResponse(result.stock),
        });
      }

      const isDamaged = body.isDamaged === true;
      const items = incomingEquipment.map((i) => ({ name: i.name, qty: i.qty }));
      const result = await returnEquipmentQuickAtomic({
        id,
        normalItems: isDamaged ? [] : items,
        damagedItems: isDamaged ? items : [],
      });
      return NextResponse.json({
        ok: true,
        equipment: result.equipment,
        issueStatus: result.issueStatus,
        stock: mapStockForResponse(result.stock),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "event not found") {
        return NextResponse.json({ error: "event not found" }, { status: 404 });
      }
      if (err instanceof Error && err.message === "insufficient stock") {
        const shortages = (err as Error & { shortages?: StockShortage[] }).shortages ?? [];
        const detail = shortages
          .map((s) => `${s.name} (ขอ ${s.requested}, คงเหลือ ${s.available})`)
          .join(", ");
        return NextResponse.json(
          { error: `สต็อกไม่พอสำหรับการเบิก: ${detail}`, shortages },
          { status: 409 }
        );
      }
      throw err;
    }
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

    // คืนอุปกรณ์เต็มจำนวน (หน้าคืนปกติ): ปิดสถานะ Event + ปรับสต็อกจริง ในธุรกรรมเดียวกันที่ backend
    if (body.issueStatus === "returned") {
      const normalItems = normalizeItemList(body.normalItems);
      const damagedItems = normalizeItemList(body.damagedItems);
      try {
        const result = await returnEventFullAtomic({ id, normalItems, damagedItems });
        return NextResponse.json({
          ok: true,
          status: { text: "รอชำระเงิน", tone: "pending" },
          stock: mapStockForResponse(result.stock),
        });
      } catch (err) {
        if (err instanceof Error && err.message === "event not found") {
          return NextResponse.json({ error: "event not found" }, { status: 404 });
        }
        throw err;
      }
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    const rowCount = await updateEventIssueStatus(id, body.issueStatus, false);
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
  try {
    const rowCount = await deleteEventById(id);
    if (rowCount === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err.code === "23001" || err.code === "23503")) {
      return NextResponse.json(
        { error: "ลบอีเวนต์นี้ไม่ได้ เพราะมีประวัติความเสียหายผูกอยู่ กรุณาจัดการเคสความเสียหายให้เสร็จก่อน" },
        { status: 409 }
      );
    }
    throw err;
  }
}
