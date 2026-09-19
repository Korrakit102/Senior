"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  Loader2,
  PackageX,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { fmt } from "../helpers";
import StockPill from "../components/StockPill";
import DamagePhotoModal from "../../reports/modals/DamagePhotoModal";

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
  cost: number;
  photoPaths: string[];
  eventTitle: string | null;
  eventCompany: string | null;
  eventPlace: string | null;
  createdAt: string;
};

type ResolveAction = "return" | "dispose";

const MAX_EQUIPMENT_CODES_LENGTH = 5000;
const MAX_NOTE_LENGTH = 100;

export default function DisposeStockModal({ open, onClose, onResolved }: Props) {
  const [lots, setLots] = useState<RepairLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [qtyByLot, setQtyByLot] = useState<Record<string, number>>({});
  const [equipmentCodesByAction, setEquipmentCodesByAction] = useState<Record<string, string>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorByLot, setErrorByLot] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [photoModalLot, setPhotoModalLot] = useState<RepairLot | null>(null);
  const [noteByLot, setNoteByLot] = useState<Record<string, string>>({});

  useBodyScrollLock(open);

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
    setEquipmentCodesByAction({});
    setSuccessMessage(null);
    setSearchQuery("");
    setSelectedGroup(null);
    setPhotoModalLot(null);
    setNoteByLot({});
    loadLots();
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

  const getActionKey = (lotId: string, action: ResolveAction) => `${lotId}-${action}`;

  const setEquipmentCodes = (lotId: string, action: ResolveAction, value: string) => {
    setEquipmentCodesByAction((prev) => ({
      ...prev,
      [getActionKey(lotId, action)]: value.slice(0, MAX_EQUIPMENT_CODES_LENGTH),
    }));
    setErrorByLot((prev) => ({ ...prev, [lotId]: "" }));
  };

  const setNote = (lotId: string, value: string) => {
    setNoteByLot((prev) => ({ ...prev, [lotId]: value.slice(0, MAX_NOTE_LENGTH) }));
  };

  const submit = async (lot: RepairLot, action: ResolveAction) => {
    const quantity = qtyByLot[lot.id] ?? lot.quantity;
    const key = getActionKey(lot.id, action);
    const equipmentCodes = (equipmentCodesByAction[key] ?? "").trim();
    const note = (noteByLot[lot.id] ?? "").trim();

    if (!equipmentCodes) {
      setErrorByLot((prev) => ({
        ...prev,
        [lot.id]:
          action === "return"
            ? "กรุณากรอกรหัสอุปกรณ์ที่คืน"
            : "กรุณากรอกรหัสอุปกรณ์ที่จำหน่าย",
      }));
      return;
    }

    setPendingKey(key);
    setErrorByLot((prev) => ({ ...prev, [lot.id]: "" }));
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/stock/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damageItemId: lot.id, quantity, action, equipmentCodes, note }),
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
      setEquipmentCodesByAction((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setNoteByLot((prev) => {
        const next = { ...prev };
        delete next[lot.id];
        return next;
      });
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
                  const returnCodesKey = getActionKey(lot.id, "return");
                  const disposeCodesKey = getActionKey(lot.id, "dispose");

                  return (
                    <div key={lot.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900">
                            {lot.eventTitle ?? `งาน ${lot.eventId ?? "-"}`}
                            {lot.eventCompany && (
                              <span className="font-normal text-zinc-500"> · {lot.eventCompany}</span>
                            )}
                          </div>
                          {lot.eventPlace && (
                            <div className="mt-0.5 text-xs text-zinc-500">{lot.eventPlace}</div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <StockPill tone="blue">{lot.stockId}</StockPill>
                            <StockPill tone="blue">{lot.stockCode}</StockPill>
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {lot.stockName} · {lot.eventId ?? "-"} ({lot.eventDate})
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-zinc-500">กำลังซ่อมแซม (ล็อตนี้)</div>
                          <div className="text-lg font-bold text-amber-600">
                            {fmt(lot.quantity)} ชิ้น
                          </div>
                          <div className="mt-1.5 text-xs text-zinc-500">มูลค่าความเสียหาย</div>
                          <div className="text-sm font-bold text-red-600">฿{fmt(lot.cost)}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="block rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                          <div className="text-xs font-semibold text-emerald-800">
                            รหัสอุปกรณ์ที่คืน
                          </div>
                          <textarea
                            value={equipmentCodesByAction[returnCodesKey] ?? ""}
                            onChange={(e) => setEquipmentCodes(lot.id, "return", e.target.value)}
                            disabled={busy}
                            maxLength={MAX_EQUIPMENT_CODES_LENGTH}
                            rows={3}
                            placeholder="เช่น LT-1234-01, LT-1234-02 หรือแยกบรรทัด"
                            className="mt-2 w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </label>

                        <label className="block rounded-xl border border-red-100 bg-red-50/50 p-3">
                          <div className="text-xs font-semibold text-red-800">
                            รหัสอุปกรณ์ที่จำหน่าย
                          </div>
                          <textarea
                            value={equipmentCodesByAction[disposeCodesKey] ?? ""}
                            onChange={(e) => setEquipmentCodes(lot.id, "dispose", e.target.value)}
                            disabled={busy}
                            maxLength={MAX_EQUIPMENT_CODES_LENGTH}
                            rows={3}
                            placeholder="เช่น LT-1234-03, LT-1234-04 หรือแยกบรรทัด"
                            className="mt-2 w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </label>
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

                      <div className="mt-3 border-t border-zinc-100 pt-3">
                        {lot.photoPaths.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {lot.photoPaths.slice(0, 4).map((src, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPhotoModalLot(lot)}
                                className="block h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 hover:opacity-80"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" className="h-full w-full object-cover" />
                              </button>
                            ))}
                            {lot.photoPaths.length > 4 && (
                              <button
                                type="button"
                                onClick={() => setPhotoModalLot(lot)}
                                className="text-xs font-medium text-zinc-400 hover:text-zinc-600 hover:underline"
                              >
                                +{lot.photoPaths.length - 4}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                            <ImageOff className="h-3.5 w-3.5" />
                            ไม่มีรูปหลักฐาน
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <textarea
                          value={noteByLot[lot.id] ?? ""}
                          onChange={(e) => setNote(lot.id, e.target.value)}
                          disabled={busy}
                          maxLength={MAX_NOTE_LENGTH}
                          rows={2}
                          placeholder="หมายเหตุ (ถ้ามี)..."
                          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div
                          className={`mt-1 text-right text-xs ${
                            (noteByLot[lot.id]?.length ?? 0) >= MAX_NOTE_LENGTH
                              ? "text-red-600"
                              : (noteByLot[lot.id]?.length ?? 0) > 90
                                ? "text-amber-600"
                                : "text-zinc-400"
                          }`}
                        >
                          {noteByLot[lot.id]?.length ?? 0}/{MAX_NOTE_LENGTH}
                        </div>
                      </div>
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

      <DamagePhotoModal
        open={photoModalLot !== null}
        itemName={photoModalLot?.stockName ?? ""}
        photos={photoModalLot?.photoPaths ?? []}
        onClose={() => setPhotoModalLot(null)}
      />
    </div>
  );
}
