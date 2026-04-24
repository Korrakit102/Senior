"use server";

import { NextRequest, NextResponse } from "next/server";
import type { EventRow } from "@/lib/db";
import { insertEvent, listEvents } from "@/lib/db";

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
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
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

export async function GET() {
  const rows = await listEvents();
  return NextResponse.json(rows.map(mapEvent));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.company || !body?.place || !body?.startDate || !body?.endDate) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
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
    equipment: [],
  });

  return NextResponse.json({
    id,
    createdAt,
  });
}
