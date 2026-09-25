"use client";

import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Package2, Plus, Search, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type {
  EquipmentItem,
  EquipmentOption,
  EventEquipmentItem,
  IssueEvent,
} from "../types";
import { mergeEquipmentItems, removeEquipmentItem } from "../helpers";
import SelectEquipmentModal from "./SelectEquipmentModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (eventId: string, items: EquipmentItem[]) => void | Promise<void>;
  equipmentOptions: EquipmentOption[];
  eventOptions: IssueEvent[];
  eventEquipmentById: Record<string, EventEquipmentItem[]>;
};

export default function QuickIssueModal({
  open,
  onClose,
  onConfirm,
  equipmentOptions,
  eventOptions,
  eventEquipmentById,
}: Props) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useBodyScrollLock(open);

  React.useEffect(() => {
    if (!open) {
      setItems([]);
      setSelectedEventId("");
      setIsSelectOpen(false);
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

  const existingEquipment = useMemo(
    () => (selectedEventId ? eventEquipmentById[selectedEventId] ?? [] : []),
    [eventEquipmentById, selectedEventId]
  );

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

            <div className="max-h-[80vh] space-y-4 overflow-y-auto overscroll-contain px-5 pb-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  เลือกอีเวนต์ <span className="text-red-600">*</span>
                </label>
                <EventDropdown
                  value={selectedEventId}
                  options={eventOptions}
                  onChange={(eventId) => {
                    setSelectedEventId(eventId);
                    setItems([]);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-800">
                  อุปกรณ์เพิ่มใหม่ ({items.length})
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

              {!selectedEventId ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                  <Package2 className="h-10 w-10 text-zinc-300" />
                  <div className="mt-3 text-sm text-zinc-400">
                    กรุณาเลือกอีเวนต์ก่อน
                  </div>
                </div>
              ) : items.length === 0 && existingEquipment.length === 0 ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                  <Package2 className="h-10 w-10 text-zinc-300" />
                  <div className="mt-3 text-sm text-zinc-400">
                    ยังไม่มีอุปกรณ์ในอีเวนต์นี้
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.length > 0 ? (
                    <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700">
                        เพิ่มใหม่
                      </div>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-4 py-3"
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
                  ) : null}

                  {existingEquipment.length > 0 ? (
                    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs font-semibold text-zinc-600">
                        อุปกรณ์ที่จัดไว้แล้ว
                      </div>
                      {existingEquipment.map((item) => (
                        <div
                          key={item.name}
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
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                            เดิม
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
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

function EventDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: IssueEvent[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((event) => event.id === value);
  const selectedLabel = selected
    ? `${selected.title} (${selected.code}) - ${selected.company}`
    : "";

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter((event) =>
      [event.title, event.code, event.company]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [options, query]);

  const openDropdown = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropUp(spaceBelow < 280 && spaceAbove > spaceBelow);
    }
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeDropdown = () => {
    setOpen(false);
    setQuery("");
  };

  const selectEvent = (eventId: string) => {
    onChange(eventId);
    closeDropdown();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeDropdown() : openDropdown())}
        className={[
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50 px-3 text-left",
          open
            ? "border-emerald-200 ring-2 ring-emerald-100"
            : "border-zinc-200 hover:border-zinc-300",
        ].join(" ")}
      >
        <span className={selectedLabel ? "truncate text-sm text-zinc-900" : "text-sm text-zinc-400"}>
          {selectedLabel || "เลือกอีเวนต์..."}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-[200] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ${
            dropUp ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาอีเวนต์..."
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-zinc-300 hover:text-zinc-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ul className="max-h-56 overflow-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => selectEvent("")}
                className={[
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                  value === ""
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                <span
                  className={`flex h-2 w-2 shrink-0 rounded-full ${
                    value === "" ? "bg-blue-500" : "bg-transparent"
                  }`}
                />
                เลือกอีเวนต์...
              </button>
            </li>

            {filtered.map((event) => {
              const active = event.id === value;

              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => selectEvent(event.id)}
                    className={[
                      "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                      active
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-zinc-700 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <span
                      className={`flex h-2 w-2 shrink-0 rounded-full ${
                        active ? "bg-blue-500" : "bg-transparent"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate">
                        {event.title} ({event.code})
                      </span>
                      <span className="block truncate text-xs font-normal text-zinc-400">
                        {event.company}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-5 text-center text-sm text-zinc-400">
                ไม่พบอีเวนต์ที่ค้นหา
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
