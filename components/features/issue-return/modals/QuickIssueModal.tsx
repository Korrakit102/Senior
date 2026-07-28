"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Package2, Plus, X } from "lucide-react";
import type { EquipmentItem, EquipmentOption, IssueEvent } from "../types";
import { mergeEquipmentItems, removeEquipmentItem } from "../helpers";
import SelectEquipmentModal from "./SelectEquipmentModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (eventId: string, items: EquipmentItem[]) => void | Promise<void>;
  equipmentOptions: EquipmentOption[];
  eventOptions: IssueEvent[];
};

export default function QuickIssueModal({
  open,
  onClose,
  onConfirm,
  equipmentOptions,
  eventOptions,
}: Props) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setItems([]);
      setSelectedEventId("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSelectOpen) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isSelectOpen]);

  const addItem = (item: EquipmentItem) => {
    setItems((prev) => mergeEquipmentItems(prev, item));
  };

  const removeItem = (id: string) => {
    setItems((prev) => removeEquipmentItem(prev, id));
  };

  const availableEquipmentOptions = useMemo(
    () =>
      equipmentOptions
        .map((option) => {
          const selectedQty = items.find((item) => item.id === option.id)?.qty ?? 0;
          return {
            ...option,
            available: Math.max(0, option.available - selectedQty),
          };
        })
        .filter((option) => option.available > 0),
    [equipmentOptions, items]
  );

  const canConfirm = selectedEventId && items.length > 0;

  if (!open) return null;

  return (
    <>
      <SelectEquipmentModal
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        onAdd={addItem}
        equipmentOptions={availableEquipmentOptions}
      />

      <div className="fixed inset-0 z-[140]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <div className="text-lg font-semibold text-zinc-900">
                  เบิกอุปกรณ์ด่วน
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  เลือกอีเวนต์และเพิ่มอุปกรณ์ที่จะเบิก
                </div>
              </div>

              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[80vh] space-y-4 overflow-y-auto px-5 pb-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  เลือกอีเวนต์ <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setItems([]);
                  }}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">เลือกอีเวนต์...</option>
                  {eventOptions.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({event.code}) - {event.company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-800">
                  อุปกรณ์ที่เลือก ({items.length})
                </div>

                <button
                  onClick={() => setIsSelectOpen(true)}
                  disabled={!selectedEventId || availableEquipmentOptions.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มอุปกรณ์
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                  <Package2 className="h-10 w-10 text-zinc-300" />
                  <div className="mt-3 text-sm text-zinc-400">
                    ยังไม่ได้เลือกอุปกรณ์
                  </div>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          จำนวน: {item.qty} ชิ้น
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
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
                  onClick={() => {
                    if (!selectedEventId) return;
                    void onConfirm(selectedEventId, items);
                    onClose();
                  }}
                  disabled={!canConfirm}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  ยืนยันการเบิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
