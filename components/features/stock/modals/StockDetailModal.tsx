"use client";

import React from "react";
import { X } from "lucide-react";
import type { StockRow } from "../types";
import { fmt, getCategoryTone, getDisplayStatus, getStatusTone } from "../helpers";
import StockPill from "../components/StockPill";

type Props = {
  item: StockRow | null;
  onClose: () => void;
};

type StockReceiptEntry = {
  id: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  poNumber: string | null;
  newAvgCost: number;
  createdAt: string;
};

type RepairHistoryEntry = {
  id: string;
  quantity: number;
  eventId: string | null;
  createdAt: string;
};

export default function StockDetailModal({ item, onClose }: Props) {
  const [receipts, setReceipts] = React.useState<StockReceiptEntry[]>([]);
  const [receiptsLoading, setReceiptsLoading] = React.useState(false);
  const [receiptsError, setReceiptsError] = React.useState<string | null>(null);

  const [repairs, setRepairs] = React.useState<RepairHistoryEntry[]>([]);
  const [repairsLoading, setRepairsLoading] = React.useState(false);
  const [repairsError, setRepairsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!item) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  React.useEffect(() => {
    if (!item) {
      setReceipts([]);
      setReceiptsError(null);
      return;
    }

    let cancelled = false;
    setReceiptsLoading(true);
    setReceiptsError(null);

    fetch(`/api/stock/receive?equipmentId=${encodeURIComponent(item.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed to load receipts");
        return res.json();
      })
      .then((rows: StockReceiptEntry[]) => {
        if (!cancelled) setReceipts(rows);
      })
      .catch(() => {
        if (!cancelled) setReceiptsError("โหลดประวัติการรับเข้าไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setReceiptsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.id]);

  React.useEffect(() => {
    if (!item) {
      setRepairs([]);
      setRepairsError(null);
      return;
    }

    let cancelled = false;
    setRepairsLoading(true);
    setRepairsError(null);

    fetch(`/api/stock/repairs?equipmentId=${encodeURIComponent(item.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed to load repairs");
        return res.json();
      })
      .then((rows: RepairHistoryEntry[]) => {
        if (!cancelled) setRepairs(rows);
      })
      .catch(() => {
        if (!cancelled) setRepairsError("โหลดประวัติการแจ้งซ่อมไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setRepairsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.id]);

  if (!item) return null;

  const displayStatus = getDisplayStatus(item);
  const statusTone = getStatusTone(displayStatus);
  const catTone = getCategoryTone(item.category);

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                รายละเอียดอุปกรณ์
              </div>
              <div className="mt-1 text-sm text-zinc-500">{item.name}</div>
            </div>

            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  รหัสอุปกรณ์
                </div>
                <div className="flex gap-2">
                  <StockPill tone="blue">{item.id}</StockPill>
                  <StockPill tone="blue">{item.code}</StockPill>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  สถานะ
                </div>
                <StockPill tone={statusTone}>{displayStatus}</StockPill>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  ชื่ออุปกรณ์
                </div>
                <div className="font-semibold text-zinc-900">{item.name}</div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  ยี่ห้อ
                </div>
                <div className="text-zinc-800">{item.brand}</div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  ประเภท
                </div>
                <div className="flex gap-2 items-center">
                  <StockPill tone={catTone}>{item.category}</StockPill>
                  <span className="text-zinc-500">{item.system}</span>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  โซนจัดเก็บ
                </div>
                <StockPill tone="blue">{item.zone}</StockPill>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  จำนวนรวม
                </div>
                <div className="text-lg font-semibold text-zinc-900">
                  {fmt(item.qty)} ชิ้น
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  จำนวนพร้อมใช้
                </div>
                <div className="text-lg font-semibold text-emerald-600">
                  {fmt(item.available)} ชิ้น
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  ค่าบริการ/วัน
                </div>
                <div className="text-lg font-semibold text-zinc-900">
                  {fmt(item.pricePerDay)} ฿
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">
                  ราคาต้นทุน
                </div>
                <div className="text-lg font-semibold text-zinc-900">
                  {fmt(item.cost)} ฿
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-3 text-xs font-semibold text-zinc-700">
                สรุปการใช้งาน
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {fmt(item.available)}
                  </div>
                  <div className="text-xs text-zinc-500">พร้อมใช้</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-600">
                    {fmt(Math.max(0, item.qty - item.available - item.repairing))}
                  </div>
                  <div className="text-xs text-zinc-500">ใช้งานอยู่ในอีเวนต์</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {fmt(item.repairing)}
                  </div>
                  <div className="text-xs text-zinc-500">กำลังซ่อม</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {fmt(item.qty)}
                  </div>
                  <div className="text-xs text-zinc-500">รวมทั้งหมด</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-3 text-xs font-semibold text-zinc-700">
                ประวัติการรับเข้า
              </div>

              {receiptsLoading && (
                <div className="text-sm text-zinc-500">กำลังโหลด...</div>
              )}

              {!receiptsLoading && receiptsError && (
                <div className="text-sm text-red-600">{receiptsError}</div>
              )}

              {!receiptsLoading && !receiptsError && receipts.length === 0 && (
                <div className="text-sm text-zinc-500">
                  ยังไม่มีประวัติการรับเข้า
                </div>
              )}

              {!receiptsLoading && !receiptsError && receipts.length > 0 && (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {receipts.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900">
                          +{fmt(r.quantity)} ชิ้น
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(r.createdAt).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600">
                        <div>
                          ราคาซื้อต่อหน่วย:{" "}
                          <span className="font-medium text-zinc-800">
                            {fmt(r.unitCost)} ฿
                          </span>
                        </div>
                        <div>
                          ต้นทุนเฉลี่ยหลังรับเข้า:{" "}
                          <span className="font-medium text-zinc-800">
                            {r.newAvgCost.toLocaleString("th-TH", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            ฿
                          </span>
                        </div>
                        <div>
                          ผู้จัดจำหน่าย:{" "}
                          <span className="font-medium text-zinc-800">
                            {r.supplier}
                          </span>
                        </div>
                        <div>
                          เลขที่ PO:{" "}
                          <span className="font-medium text-zinc-800">
                            {r.poNumber || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-3 text-xs font-semibold text-zinc-700">
                ประวัติการแจ้งซ่อม
              </div>

              {repairsLoading && (
                <div className="text-sm text-zinc-500">กำลังโหลด...</div>
              )}

              {!repairsLoading && repairsError && (
                <div className="text-sm text-red-600">{repairsError}</div>
              )}

              {!repairsLoading && !repairsError && repairs.length === 0 && (
                <div className="text-sm text-zinc-500">
                  ไม่มีรายการที่กำลังซ่อม
                </div>
              )}

              {!repairsLoading && !repairsError && repairs.length > 0 && (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {repairs.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-700">
                          {fmt(r.quantity)} ชิ้น
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(r.createdAt).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-zinc-600">
                        อีเวนต์ที่เกี่ยวข้อง:{" "}
                        <span className="font-medium text-zinc-800">
                          {r.eventId || "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}