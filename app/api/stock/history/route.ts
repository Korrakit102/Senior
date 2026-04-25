"use server";

import { NextRequest, NextResponse } from "next/server";
import { listStockHistory } from "@/lib/db";

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 100), 500) : 100;
  const rows = await listStockHistory(limit);
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      stockId: r.stock_id,
      stockCode: r.stock_code,
      stockName: r.stock_name,
      fieldName: r.field_name,
      changeType: r.change_type,
      oldValue: r.old_value,
      newValue: r.new_value,
      delta: r.delta,
      createdAt: r.created_at,
    }))
  );
}
