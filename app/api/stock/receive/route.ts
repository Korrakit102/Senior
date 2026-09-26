"use server";

import { NextRequest, NextResponse } from "next/server";
import { listStockReceiptsByStockId, receiveStock } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";

// ดึงประวัติการรับเข้าสต็อกของอุปกรณ์ตัวเดียว ใช้แสดงใน StockDetailModal
export async function GET(req: NextRequest) {
  const equipmentId = req.nextUrl.searchParams.get("equipmentId");
  if (!equipmentId) {
    return NextResponse.json({ error: "equipmentId is required" }, { status: 400 });
  }

  const rows = await listStockReceiptsByStockId(equipmentId);
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      stockId: r.stock_id,
      stockCode: r.stock_code,
      stockName: r.stock_name,
      quantity: r.quantity,
      unitCost: Number(r.unit_cost),
      supplier: r.supplier,
      poNumber: r.po_number,
      prevQty: r.prev_qty,
      prevAvgCost: Number(r.prev_avg_cost),
      newQty: r.new_qty,
      newAvgCost: Number(r.new_avg_cost),
      shippingCost: Number(r.shipping_cost),
      otherCost: Number(r.other_cost),
      receivedByRole: r.received_by_role,
      createdAt: r.created_at,
    }))
  );
}

// รับเข้าสต็อก: คำนวณต้นทุนเฉลี่ยใหม่และบันทึกประวัติการรับเข้า (stock_receipts) แบบ atomic
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const equipmentId = body?.equipmentId;
  const quantity = body?.quantity;
  const unitCost = body?.unitCost;
  const shippingCost = body?.shippingCost;
  const otherCost = body?.otherCost;
  const supplier = body?.supplier;
  const poNumber = body?.poNumber;
  const role = body?.role;

  const valid =
    typeof equipmentId === "string" && equipmentId.trim().length > 0 &&
    typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0 &&
    typeof unitCost === "number" && unitCost > 0 &&
    typeof supplier === "string" && supplier.trim().length > 0 &&
    typeof role === "string" && role.trim().length > 0 &&
    (poNumber === undefined || poNumber === null || typeof poNumber === "string") &&
    (shippingCost === undefined || shippingCost === null || (typeof shippingCost === "number" && shippingCost >= 0)) &&
    (otherCost === undefined || otherCost === null || (typeof otherCost === "number" && otherCost >= 0));

  if (!valid) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  // ค่าส่ง+ค่าอื่นๆ รวมกัน ห้ามเกิน 50% ของมูลค่าสินค้าหลัก (unitCost x quantity) กันกรอกเลขศูนย์เกินโดยไม่ตั้งใจ
  const productValue = quantity * unitCost;
  const extraCost = (shippingCost ?? 0) + (otherCost ?? 0);
  if (extraCost > productValue * 0.5) {
    return NextResponse.json(
      { error: "ค่าส่ง+ค่าอื่นๆ รวมกันสูงเกินไป ต้องไม่เกิน 50% ของมูลค่าสินค้าหลัก (จำนวน x ราคาต่อหน่วย)" },
      { status: 400 }
    );
  }

  try {
    const updated = await receiveStock({
      equipmentId,
      quantity,
      unitCost,
      shippingCost: typeof shippingCost === "number" ? shippingCost : undefined,
      otherCost: typeof otherCost === "number" ? otherCost : undefined,
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
        warehouseAddress: updated.warehouse_address ?? "",
        status: updated.status,
        qty: updated.qty,
        available: updated.available,
        pricePerDay: updated.price_per_day,
        cost: updated.cost,
        repairing: updated.repairing,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "stock item not found") {
      return NextResponse.json({ error: "stock item not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "failed to receive stock" }, { status: 500 });
  }
}
