"use server";

import { NextRequest, NextResponse } from "next/server";
import { listRepairingHistoryByStockId } from "@/lib/db";

// ดึงประวัติการแจ้งซ่อมของอุปกรณ์ตัวเดียว ใช้แสดงใน StockDetailModal
export async function GET(req: NextRequest) {
  const equipmentId = req.nextUrl.searchParams.get("equipmentId");
  if (!equipmentId) {
    return NextResponse.json({ error: "equipmentId is required" }, { status: 400 });
  }

  const rows = await listRepairingHistoryByStockId(equipmentId);
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      stockId: r.stock_id,
      stockCode: r.stock_code,
      stockName: r.stock_name,
      quantity: r.delta,
      eventId: r.event_id,
      createdAt: r.created_at,
    }))
  );
}
