"use server";

import { NextRequest, NextResponse } from "next/server";
import type { EventRow } from "@/lib/db";
import { insertEvent, listEvents } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

function mapEvent(row: EventRow) {
  return {
    id: row.id,
    title: row.title,
    status: { text: row.status_text, tone: row.status_tone },
    issueStatus: row.issue_status,
    isDamaged: row.is_damaged,
    code: `#${row.id}`,
    createdAt: row.created_at,
    desc: row.description,
    company: row.company,
    place: row.place,
    date: `${row.start_date} - ${row.end_date}`,
    items: `${row.items_count} รายการ`,
    organizer: row.organizer ?? undefined,
    branchCode: row.branch_code ?? undefined,
    budgetTHB: row.budget_thb ?? undefined,
    attendees: row.attendees ?? undefined,
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    customerTaxId: row.customer_tax_id ?? undefined,
    workOrderSalesTargets: row.work_order_sales_targets ?? undefined,
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    paymentReceipt:
      row.receipt_file_name &&
      (row.receipt_file_path || row.receipt_data_url) &&
      row.receipt_uploaded_at
        ? {
            fileName: row.receipt_file_name,
            fileType: row.receipt_file_type ?? "",
            dataUrl: row.receipt_file_path ?? row.receipt_data_url ?? "",
            uploadedAt: row.receipt_uploaded_at,
          }
        : undefined,
  };
}

function nextEventId(rows: EventRow[]) {
  let max = 0;
  for (const row of rows) {
    const match = row.id.match(/^EVT(\d+)$/);
    if (!match) continue;
    max = Math.max(max, Number(match[1]));
  }
  return `EVT${String(max + 1).padStart(3, "0")}`;
}

function canReturnEventForRole(row: EventRow, role: string | null) {
  if (role !== "Stockkeeper") return true;

  return row.status_tone === "success" || row.status_tone === "progress";
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const rows = await listEvents();
  return NextResponse.json(rows.filter((row) => canReturnEventForRole(row, role)).map(mapEvent));
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_ID_PATTERN = /^\d{13}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.company || !body?.place || !body?.startDate || !body?.endDate) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
  if (customerEmail && !EMAIL_PATTERN.test(customerEmail)) {
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  const customerTaxId = typeof body.customerTaxId === "string" ? body.customerTaxId.trim() : "";
  if (customerTaxId && !TAX_ID_PATTERN.test(customerTaxId)) {
    return NextResponse.json(
      { error: "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" },
      { status: 400 }
    );
  }

  const current = await listEvents();
  const id = nextEventId(current);
  const createdAt = new Date().toISOString();

  await insertEvent({
    id,
    title: body.title,
    statusText: "รออนุมัติ",
    statusTone: "pending",
    createdAt,
    description: body.desc ?? "",
    company: body.company,
    place: body.place,
    startDate: body.startDate,
    endDate: body.endDate,
    itemsCount: 0,
    organizer: body.organizer,
    branchCode: body.branchCode,
    budgetTHB: typeof body.budgetTHB === "number" ? body.budgetTHB : undefined,
    attendees: typeof body.attendees === "number" ? body.attendees : undefined,
    contactName: typeof body.contactName === "string" ? body.contactName : undefined,
    contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : undefined,
    customerEmail: customerEmail || undefined,
    customerTaxId: customerTaxId || undefined,
    equipment: [],
  });

  return NextResponse.json({
    id,
    createdAt,
  });
}
