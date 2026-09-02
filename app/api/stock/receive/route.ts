"use server";

import { NextRequest, NextResponse } from "next/server";
import { receiveStock } from "@/lib/db";

// รับเข้าสต็อก: คำนวณต้นทุนเฉลี่ยใหม่และบันทึกประวัติการรับเข้า (stock_receipts) แบบ atomic
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const equipmentId = body?.equipmentId;
  const quantity = body?.quantity;
  const unitCost = body?.unitCost;
  const supplier = body?.supplier;
  const poNumber = body?.poNumber;
  const role = body?.role;

  const valid =
    typeof equipmentId === "string" && equipmentId.trim().length > 0 &&
    typeof quantity === "number" && quantity > 0 &&
    typeof unitCost === "number" && unitCost > 0 &&
    typeof supplier === "string" && supplier.trim().length > 0 &&
    typeof role === "string" && role.trim().length > 0 &&
    (poNumber === undefined || poNumber === null || typeof poNumber === "string");

  if (!valid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const updated = await receiveStock({
      equipmentId,
      quantity,
      unitCost,
      supplier,
      poNumber: typeof poNumber === "string" && poNumber.trim() ? poNumber.trim() : undefined,
      receivedByRole: role,
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        brand: updated.brand,
        category: updated.category,
        system: updated.system,
        zone: updated.zone,
        status: updated.status,
        qty: updated.qty,
        available: updated.available,
        pricePerDay: updated.price_per_day,
        cost: updated.cost,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "stock item not found") {
      return NextResponse.json({ error: "stock item not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "failed to receive stock" }, { status: 500 });
  }
}
