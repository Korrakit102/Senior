"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { DamageRow } from "../types";

type Props = {
  open: boolean;
  damageRow: DamageRow | null;
  onClose: () => void;
  onSave: (payload: { cost: number; billedCost: number }) => void;
};

export default function EditDamageAmountModal({ open, damageRow, onClose, onSave }: Props) {
  const [cost, setCost] = useState("");
  const [billedCost, setBilledCost] = useState("");
  const [errors, setErrors] = useState<{ cost?: string; billedCost?: string }>({});

  useEffect(() => {
    if (!open || !damageRow) return;
    const initialCost = String(damageRow.cost ?? 0);
    setCost(initialCost);
    setBilledCost(
      damageRow.billedCost != null ? String(damageRow.billedCost) : initialCost
    );
    setErrors({});
  }, [open, damageRow]);

  if (!open || !damageRow) return null;

  const validate = () => {
    const e: { cost?: string; billedCost?: string } = {};
    if (!cost.trim() || Number.isNaN(Number(cost)) || Number(cost) < 0) {
      e.cost = "กรุณากรอกมูลค่าความเสียหายเป็นตัวเลขไม่ติดลบ";
    }
    if (!billedCost.trim() || Number.isNaN(Number(billedCost)) || Number(billedCost) < 0) {
      e.billedCost = "กรุณากรอกมูลค่าเรียกเก็บเป็นตัวเลขไม่ติดลบ";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ cost: Number(cost), billedCost: Number(billedCost) });
  };

  return (
    <div className="fixed inset-0 z-[210]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">แก้ไขมูลค่าความเสียหาย</div>
              <div className="mt-1 text-sm text-zinc-500">{damageRow.itemName}</div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <div className="mb-1 text-xs font-semibold text-zinc-700">
                มูลค่าความเสียหาย (บาท) <span className="text-red-600">*</span>
              </div>
              <input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                type="number"
                min={0}
                placeholder="กรอกมูลค่าความเสียหาย"
                className={[
                  "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
                  errors.cost
                    ? "border-red-300 ring-2 ring-red-100"
                    : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
                ].join(" ")}
              />
              {errors.cost && <div className="mt-1 text-xs text-red-600">{errors.cost}</div>}
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-zinc-700">
                มูลค่าเรียกเก็บ (บาท) <span className="text-red-600">*</span>
              </div>
              <input
                value={billedCost}
                onChange={(e) => setBilledCost(e.target.value)}
                type="number"
                min={0}
                placeholder="กรอกมูลค่าที่จะเรียกเก็บจริง"
                className={[
                  "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
                  errors.billedCost
                    ? "border-red-300 ring-2 ring-red-100"
                    : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
                ].join(" ")}
              />
              {errors.billedCost && (
                <div className="mt-1 text-xs text-red-600">{errors.billedCost}</div>
              )}
              <div className="mt-1 text-xs text-zinc-500">
                จำนวนเงินที่จะเรียกเก็บจริงจากผู้ทำเสียหาย ใช้แทนมูลค่าความเสียหายตอนออกใบแจ้งหนี้
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 p-5">
            <button
              onClick={onClose}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
