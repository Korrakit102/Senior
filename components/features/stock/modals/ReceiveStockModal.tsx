"use client";

import React, { useState } from "react";
import { AlertTriangle, Minus, Plus, X } from "lucide-react";
import type { StockRow } from "../types";
import { fmt } from "../helpers";
import StockField from "../components/StockField";
import StockPill from "../components/StockPill";

type Props = {
  open: boolean;
  item: StockRow | null;
  onClose: () => void;
};

const SUPPLIERS = [
  "บริษัท เอบีซี ซัพพลาย จำกัด",
  "หจก. ไทยอีเลคทริค",
  "บริษัท ผ้าใบไทย จำกัด",
  "ร้านวัสดุตกแต่งงานอีเวนต์",
  "อื่นๆ",
];

const ADD_NEW_SUPPLIER_VALUE = "__add_new_supplier__";

function normalizeSupplierName(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function levenshteinDistance(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp[m][n];
}

function findSimilarSupplier(name: string, list: string[]): string | null {
  const target = normalizeSupplierName(name);
  if (!target) return null;

  for (const candidateRaw of list) {
    const candidate = normalizeSupplierName(candidateRaw);
    if (candidate === target) return candidateRaw;

    const longer = candidate.length >= target.length ? candidate : target;
    const shorter = candidate.length >= target.length ? target : candidate;
    if (shorter.length >= 3 && longer.includes(shorter)) return candidateRaw;

    const distance = levenshteinDistance(candidate, target);
    const threshold = Math.max(
      1,
      Math.floor(Math.min(candidate.length, target.length) * 0.2)
    );
    if (distance <= threshold) return candidateRaw;
  }

  return null;
}

export default function ReceiveStockModal({ open, item, onClose }: Props) {
  const [receiveQty, setReceiveQty] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [poNumber, setPoNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customSuppliers, setCustomSuppliers] = useState<string[]>([]);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierError, setNewSupplierError] = useState<string | undefined>();
  const [duplicateSupplierWarning, setDuplicateSupplierWarning] = useState<
    string | null
  >(null);

  const allSuppliers = [...SUPPLIERS, ...customSuppliers];

  React.useEffect(() => {
    if (!open) return;
    setReceiveQty(1);
    setPurchasePrice("");
    setSupplier(SUPPLIERS[0]);
    setPoNumber("");
    setErrors({});
    setIsAddingSupplier(false);
    setNewSupplierName("");
    setNewSupplierError(undefined);
    setDuplicateSupplierWarning(null);
  }, [open, item]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const currentQty = item.qty;
  const currentAvgCost = item.cost;
  const newQty = receiveQty;
  const newPrice = Number(purchasePrice) || 0;

  const combinedQty = currentQty + newQty;
  const newAvgCost =
    combinedQty > 0
      ? (currentQty * currentAvgCost + newQty * newPrice) / combinedQty
      : currentAvgCost;
  const percentChange =
    currentAvgCost > 0
      ? ((newAvgCost - currentAvgCost) / currentAvgCost) * 100
      : 0;

  const validate = () => {
    const e: Record<string, string> = {};

    if (!receiveQty || receiveQty <= 0) {
      e.receiveQty = "จำนวนที่รับเข้าต้องมากกว่า 0";
    }

    if (!purchasePrice.trim()) {
      e.purchasePrice = "กรุณาระบุราคาซื้อต่อหน่วย";
    } else if (Number.isNaN(newPrice) || newPrice <= 0) {
      e.purchasePrice = "ราคาซื้อต้องเป็นตัวเลขมากกว่า 0";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    console.log("รับเข้าสต็อก:", {
      equipmentId: item.id,
      equipmentName: item.name,
      sku: item.code,
      currentQty,
      currentAvgCost,
      receiveQty,
      purchasePrice: newPrice,
      supplier,
      poNumber: poNumber.trim(),
      newAvgCost,
      percentChange,
    });

    onClose();
  };

  const addNewSupplier = (name: string) => {
    setCustomSuppliers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setSupplier(name);
    setIsAddingSupplier(false);
    setNewSupplierName("");
    setNewSupplierError(undefined);
    setDuplicateSupplierWarning(null);
  };

  const handleConfirmNewSupplier = () => {
    const trimmed = newSupplierName.trim();
    if (!trimmed) {
      setNewSupplierError("กรุณากรอกชื่อผู้จัดจำหน่าย");
      return;
    }
    setNewSupplierError(undefined);

    const similar = findSimilarSupplier(trimmed, allSuppliers);
    if (similar) {
      setDuplicateSupplierWarning(similar);
      return;
    }

    addNewSupplier(trimmed);
  };

  const handleUseExistingSupplier = () => {
    if (!duplicateSupplierWarning) return;
    setSupplier(duplicateSupplierWarning);
    setIsAddingSupplier(false);
    setNewSupplierName("");
    setNewSupplierError(undefined);
    setDuplicateSupplierWarning(null);
  };

  const handleConfirmAddDespiteSimilar = () => {
    const trimmed = newSupplierName.trim();
    if (!trimmed) return;
    addNewSupplier(trimmed);
  };

  const handleCancelNewSupplier = () => {
    setIsAddingSupplier(false);
    setNewSupplierName("");
    setNewSupplierError(undefined);
    setDuplicateSupplierWarning(null);
  };

  const inp = (err?: string) =>
    [
      "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
      err
        ? "border-red-300 ring-2 ring-red-100"
        : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
    ].join(" ");

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                รับเข้าสต็อก
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                เพิ่มจำนวนสต็อกให้อุปกรณ์ที่มีอยู่แล้ว
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* equipment info (read-only) */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="font-semibold text-zinc-900">{item.name}</div>
              <div className="mt-2 flex items-center gap-2">
                <StockPill tone="blue">{item.id}</StockPill>
                <StockPill tone="blue">{item.code}</StockPill>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StockField label="จำนวนที่รับเข้า" required error={errors.receiveQty}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setReceiveQty((q) => Math.max(0, q - 1))
                    }
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    type="number"
                    value={receiveQty}
                    onChange={(e) =>
                      setReceiveQty(Math.max(0, Number(e.target.value) || 0))
                    }
                    className={`${inp(errors.receiveQty)} text-center`}
                  />

                  <button
                    type="button"
                    onClick={() => setReceiveQty((q) => q + 1)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </StockField>

              <StockField
                label="ราคาซื้อต่อหน่วย (บาท)"
                required
                error={errors.purchasePrice}
              >
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="ระบุราคาซื้อต่อหน่วย"
                  className={inp(errors.purchasePrice)}
                />
              </StockField>

              <StockField label="ผู้จัดจำหน่าย (Supplier)">
                {!isAddingSupplier ? (
                  <select
                    value={supplier}
                    onChange={(e) => {
                      if (e.target.value === ADD_NEW_SUPPLIER_VALUE) {
                        setIsAddingSupplier(true);
                        setNewSupplierName("");
                        setNewSupplierError(undefined);
                        setDuplicateSupplierWarning(null);
                      } else {
                        setSupplier(e.target.value);
                      }
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
                  >
                    {allSuppliers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value={ADD_NEW_SUPPLIER_VALUE}>
                      + เพิ่มผู้จัดจำหน่ายใหม่
                    </option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={newSupplierName}
                      onChange={(e) => {
                        setNewSupplierName(e.target.value);
                        setNewSupplierError(undefined);
                        setDuplicateSupplierWarning(null);
                      }}
                      placeholder="พิมพ์ชื่อผู้จัดจำหน่ายใหม่"
                      className={inp(newSupplierError)}
                    />
                    {newSupplierError && (
                      <div className="text-xs text-red-600">
                        {newSupplierError}
                      </div>
                    )}

                    {duplicateSupplierWarning && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <div>
                            มีผู้จัดจำหน่ายที่ชื่อใกล้เคียงอยู่แล้ว:{" "}
                            <span className="font-semibold">
                              {duplicateSupplierWarning}
                            </span>{" "}
                            ยืนยันจะเพิ่มใหม่ไหม?
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={handleUseExistingSupplier}
                            className="h-8 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            ใช้ชื่อเดิม
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmAddDespiteSimilar}
                            className="h-8 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            ยืนยันเพิ่มใหม่
                          </button>
                        </div>
                      </div>
                    )}

                    {!duplicateSupplierWarning && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmNewSupplier}
                          className="h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          ยืนยัน
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelNewSupplier}
                          className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </StockField>

              <StockField label="เลขที่ใบสั่งซื้อ/PO">
                <input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="ระบุเลขที่ PO (ถ้ามี)"
                  className={inp()}
                />
              </StockField>
            </div>

            {/* real-time impact preview */}
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-3 text-xs font-semibold text-zinc-700">
                สรุปผลกระทบต้นทุน
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    คงเหลือเดิม ({fmt(currentQty)} ชิ้น)
                  </span>
                  <span className="font-medium text-zinc-800">
                    {fmt(currentAvgCost)} ฿/ชิ้น
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    ล็อตใหม่ ({fmt(newQty)} ชิ้น)
                  </span>
                  <span className="font-medium text-zinc-800">
                    {fmt(newPrice)} ฿/ชิ้น
                  </span>
                </div>

                <div className="my-2 border-t border-zinc-200" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">
                    ต้นทุนเฉลี่ยใหม่ (รวม {fmt(combinedQty)} ชิ้น)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-bold text-zinc-900">
                      {newAvgCost.toLocaleString("th-TH", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      ฿/ชิ้น
                    </span>
                    <span
                      className={
                        percentChange > 0
                          ? "text-xs font-semibold text-red-600"
                          : percentChange < 0
                          ? "text-xs font-semibold text-emerald-600"
                          : "text-xs font-semibold text-zinc-500"
                      }
                    >
                      ({percentChange > 0 ? "+" : ""}
                      {percentChange.toLocaleString("th-TH", {
                        maximumFractionDigits: 2,
                      })}
                      %)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submit}
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                บันทึกรับเข้า
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
