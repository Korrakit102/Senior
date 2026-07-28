"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { EquipmentItem, EquipmentOption } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (item: EquipmentItem) => void;
  equipmentOptions: EquipmentOption[];
  availableLabel?: string;
  emptyText?: string;
};

export default function SelectEquipmentModal({
  open,
  onClose,
  onAdd,
  equipmentOptions,
  availableLabel = "พร้อมใช้",
  emptyText = "ไม่มีอุปกรณ์ให้เลือก",
}: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [error, setError] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      setSelectedId("");
      setQty("");
      setError("");
      setDropOpen(false);
    }
  }, [open]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const selected = equipmentOptions.find((o) => o.id === selectedId);

  const submit = () => {
    const q = Number(qty);

    if (!selected) {
      setError("กรุณาเลือกอุปกรณ์");
      return;
    }

    if (!q || q <= 0) {
      setError("กรุณาระบุจำนวนที่ถูกต้อง");
      return;
    }

    if (q > selected.available) {
      setError(`มีอุปกรณ์เพียง ${selected.available} ชิ้น`);
      return;
    }

    onAdd({
      id: selected.id,
      name: selected.name,
      qty: q,
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                เลือกอุปกรณ์
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                เลือกอุปกรณ์และระบุจำนวน
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 pb-5">
            <div ref={dropRef} className="relative">
              <div className="mb-1 text-xs font-semibold text-zinc-700">
                อุปกรณ์ <span className="text-red-600">*</span>
              </div>

              <button
                type="button"
                onClick={() => setDropOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900"
              >
                <span className={selected ? "text-zinc-900" : "text-zinc-400"}>
                  {selected
                    ? `${selected.name} (${availableLabel}: ${selected.available})`
                    : "เลือกอุปกรณ์..."}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform ${
                    dropOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                  {equipmentOptions.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-zinc-400">
                      {emptyText}
                    </div>
                  ) : (
                    equipmentOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(opt.id);
                          setDropOpen(false);
                          setError("");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
                          opt.id === selectedId
                            ? "bg-zinc-100 font-semibold"
                            : "bg-white"
                        }`}
                      >
                        <span className="font-medium text-zinc-900">
                          {opt.name}
                        </span>
                        <span className="text-xs font-medium text-zinc-500">
                          {availableLabel}: {opt.available}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-zinc-700">
                จำนวน <span className="text-red-600">*</span>
              </div>

              <input
                value={qty}
                onChange={(e) => {
                  setQty(e.target.value);
                  setError("");
                }}
                type="number"
                min="1"
                placeholder="ระบุจำนวน"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={onClose}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>

              <button
                onClick={submit}
                className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  เพิ่ม
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
