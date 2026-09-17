"use server";

import { NextResponse } from "next/server";
import { listReportedRepairLots } from "@/lib/db";

// ดึงล็อตที่กำลังซ่อม (damage_items ที่ status = 'reported') ทั้งหมด แยกเป็นรายการต่อ record — ใช้ในหน้าจำหน่ายสต็อก
export async function GET() {
  const rows = await listReportedRepairLots();
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      stockId: r.stock_id,
      stockCode: r.stock_code,
      stockName: r.stock_name,
      eventId: r.event_id,
      eventDate: r.event_date,
      quantity: r.qty,
      cost: r.cost,
      photoPaths: r.photo_paths ?? [],
      eventTitle: r.event_title,
      eventCompany: r.event_company,
      eventPlace: r.event_place,
      createdAt: r.created_at,
    }))
  );
}
