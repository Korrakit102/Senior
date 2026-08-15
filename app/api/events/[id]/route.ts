"use server";

import { NextRequest, NextResponse } from "next/server";
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

  // ─── อัปโหลดใบเสร็จ / ยืนยันการชำระเงิน ───────────────────────────────────
  if (body?.paymentAction) {
    if (!["uploadReceipt", "confirmPayment"].includes(body.paymentAction)) {
      return NextResponse.json({ error: "invalid paymentAction" }, { status: 400 });
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    if (body.paymentAction === "uploadReceipt") {
      if (body.role !== "SA") {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
      const fileType = typeof body.fileType === "string" ? body.fileType.trim() : "";
      const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";

      if (!fileName || !dataUrl.startsWith("data:")) {
        return NextResponse.json({ error: "receipt file is required" }, { status: 400 });
      }

      const uploadedAt = new Date().toISOString();
      const rowCount = await updateEventPaymentReceipt({
        id,
        fileName,
        fileType,
        dataUrl,
        uploadedAt,
      });

      if (rowCount === 0) {
        return NextResponse.json({ error: "event not found" }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        status: { text: "รอตรวจสอบการชำระเงิน", tone: "pending" },
        paymentReceipt: { fileName, fileType, dataUrl, uploadedAt },
      });
    }

    if (body.role !== "Manager") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (!current.receipt_data_url) {
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
