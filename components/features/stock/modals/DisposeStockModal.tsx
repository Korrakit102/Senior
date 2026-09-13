"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, PackageX, RotateCcw, Search, X } from "lucide-react";
import { fmt } from "../helpers";
import StockPill from "../components/StockPill";

type Props = {
  open: boolean;
  onClose: () => void;
  onResolved: () => Promise<void>;
};

type RepairLot = {
  id: string;
  stockId: string;
  stockCode: string;
  stockName: string;
  eventId: string | null;
  eventDate: string;
  quantity: number;
  createdAt: string;
};

export default function DisposeStockModal({ open, onClose, onResolved }: Props) {
  const [lots, setLots] = useState<RepairLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [qtyByLot, setQtyByLot] = useState<Record<string, number>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorByLot, setErrorByLot] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const loadLots = async (): Promise<RepairLot[]> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/stock/repairs/lots");
      if (!res.ok) throw new Error("failed to load repair lots");
      const rows = (await res.json()) as RepairLot[];
      setLots(rows);
      setQtyByLot(Object.fromEntries(rows.map((r) => [r.id, r.quantity])));
      return rows;
    } catch {
      setLots([]);
      setLoadError("โหลดรายการที่กำลังซ่อมไม่สำเร็จ");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setPendingKey(null);
    setErrorByLot({});
    setSuccessMessage(null);
    setSearchQuery("");
    setSelectedGroup(null);
    loadLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingKey) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pendingKey]);

  if (!open) return null;

  const filteredLots = searchQuery.trim()
    ? lots.filter((lot) =>
        lot.stockName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : lots;

  const groups = Array.from(
    filteredLots
      .reduce((map, lot) => {
        const existing = map.get(lot.stockName);
        if (existing) {
          existing.lotCount += 1;
          existing.totalQty += lot.quantity;
        } else {
          map.set(lot.stockName, {
            stockName: lot.stockName,
            stockCode: lot.stockCode,
            lotCount: 1,
            totalQty: lot.quantity,
          });
        }
        return map;
      }, new Map<string, { stockName: string; stockCode: string; lotCount: number; totalQty: number }>())
      .values()
  );

  const groupLots = selectedGroup ? lots.filter((lot) => lot.stockName === selectedGroup) : [];

  const setQty = (id: string, value: number, max: number) => {
    const clamped = Math.max(1, Math.min(max, Math.round(value) || 1));
    setQtyByLot((prev) => ({ ...prev, [id]: clamped }));
  };

  const submit = async (lot: RepairLot, action: "return" | "dispose") => {
    const quantity = qtyByLot[lot.id] ?? lot.quantity;
    const key = `${lot.id}-${action}`;
    setPendingKey(key);
    setErrorByLot((prev) => ({ ...prev, [lot.id]: "" }));
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/stock/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damageItemId: lot.id, quantity, action }),
      });

      if (!res.ok) {
        throw new Error(
          action === "return"
            ? "คืนสต็อกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
            : "จำหน่ายสต็อกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
        );
      }

      setSuccessMessage(
        action === "return"
          ? `คืน "${lot.stockName}" จากงาน ${lot.eventId ?? "-"} จำนวน ${fmt(quantity)} ชิ้น กลับเป็นพร้อมใช้แล้ว`
          : `จำหน่าย "${lot.stockName}" จากงาน ${lot.eventId ?? "-"} จำนวน ${fmt(quantity)} ชิ้นออกจากระบบแล้ว`
      );
      await onResolved();
      const freshLots = await loadLots();
      if (selectedGroup && !freshLots.some((l) => l.stockName === selectedGroup)) {
        setSelectedGroup(null);
      }
    } catch (err) {
      setErrorByLot((prev) => ({
        ...prev,
        [lot.id]: err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ",
      }));
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={pendingKey ? undefined : onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">จำหน่ายสต็อก</div>
              <div className="mt-1 text-sm text-zinc-500">
                จัดการอุปกรณ์ที่อยู่ระหว่างซ่อมแซม แยกตามล็อตที่แจ้งซ่อม — คืนเข้าสต็อกหากซ่อมเสร็จ หรือจำหน่ายออกถาวรหากซ่อมไม่ได้
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={!!pendingKey}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {selectedGroup === null ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาอุปกรณ์..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                disabled={!!pendingKey}
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับ
              </button>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                กำลังโหลด...
              </div>
            )}

            {!loading && loadError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {loadError}
              </div>
            )}

            {!loading && !loadError && lots.length === 0 && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                ไม่มีอุปกรณ์ที่อยู่ระหว่างซ่อมแซมในขณะนี้
              </div>
            )}

            {!loading && !loadError && lots.length > 0 && selectedGroup === null && groups.length === 0 && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                ไม่พบอุปกรณ์ที่ค้นหา
              </div>
            )}

            {!loading && !loadError && selectedGroup === null && groups.length > 0 && (
              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {groups.map((group) => (
                  <button
                    key={group.stockName}
                    type="button"
                    onClick={() => setSelectedGroup(group.stockName)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50"
                  >
                    <div>
                      <div className="font-semibold text-zinc-900">{group.stockName}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <StockPill tone="blue">{group.stockCode}</StockPill>
                        <span className="text-xs text-zinc-500">{group.lotCount} ล็อต</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">รวมกำลังซ่อมแซม</div>
                      <div className="text-lg font-bold text-amber-600">
                        รวม {fmt(group.totalQty)} ชิ้น
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && !loadError && selectedGroup !== null && (
              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {groupLots.map((lot) => {
                  const qty = qtyByLot[lot.id] ?? lot.quantity;
                  const busyReturn = pendingKey === `${lot.id}-return`;
                  const busyDispose = pendingKey === `${lot.id}-dispose`;
                  const busy = busyReturn || busyDispose;

                  return (
                    <div key={lot.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-zinc-900">{lot.stockName}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StockPill tone="blue">{lot.stockId}</StockPill>
                            <StockPill tone="blue">{lot.stockCode}</StockPill>
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            จากงาน {lot.eventId ?? "-"} ({lot.eventDate})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">กำลังซ่อมแซม (ล็อตนี้)</div>
                          <div className="text-lg font-bold text-amber-600">
                            {fmt(lot.quantity)} ชิ้น
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          จำนวน
                          <input
                            type="number"
                            min={1}
                            max={lot.quantity}
                            value={qty}
                            disabled={busy}
                            onChange={(e) => setQty(lot.id, Number(e.target.value), lot.quantity)}
                            className="h-9 w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-center text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          ชิ้น
                        </label>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => submit(lot, "return")}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyReturn ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          คืน (Return)
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => submit(lot, "dispose")}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyDispose ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PackageX className="h-4 w-4" />
                          )}
                          จำหน่าย (Dispose)
                        </button>
                      </div>

                      {errorByLot[lot.id] && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          {errorByLot[lot.id]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                disabled={!!pendingKey}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
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
