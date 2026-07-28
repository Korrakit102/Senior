"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  CornerDownLeft,
  Package2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import type { EquipmentItem, EventEquipmentItem, IssueEvent } from "../types";
import { mergeEquipmentItems, removeEquipmentItem } from "../helpers";
import SelectEquipmentModal from "./SelectEquipmentModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    eventId: string,
    items: EquipmentItem[],
    damaged: boolean,
    photos: File[]
  ) => void | Promise<void>;
  eventOptions: IssueEvent[];
  eventEquipmentById: Record<string, EventEquipmentItem[]>;
};

export default function QuickReturnModal({
  open,
  onClose,
  onConfirm,
  eventOptions,
  eventEquipmentById,
}: Props) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isDamaged, setIsDamaged] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setItems([]);
      setSelectedEventId("");
      setIsDamaged(false);
      setPhotos([]);
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

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)]);
  };

  const selectedEventEquipment = selectedEventId
    ? eventEquipmentById[selectedEventId] ?? []
    : [];

  const selectedEquipmentOptions = useMemo(
    () =>
      selectedEventEquipment.map((item) => ({
        id: `${selectedEventId}-${item.name}`,
        name: item.name,
        available: item.qty,
      })),
    [selectedEventEquipment, selectedEventId]
  );

  const availableEquipmentOptions = useMemo(
    () =>
      selectedEquipmentOptions
        .map((option) => {
          const selectedQty = items.find((item) => item.id === option.id)?.qty ?? 0;
          return {
            ...option,
            available: Math.max(0, option.available - selectedQty),
          };
        })
        .filter((option) => option.available > 0),
    [selectedEquipmentOptions, items]
  );

  const canConfirm =
    Boolean(selectedEventId) &&
    items.length > 0 &&
    (!isDamaged || photos.length > 0);

  if (!open) return null;

  return (
    <>
      <SelectEquipmentModal
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        onAdd={addItem}
        equipmentOptions={availableEquipmentOptions}
        availableLabel="อยู่ในอีเวนต์"
        emptyText="ไม่มีอุปกรณ์ค้างอยู่ในอีเวนต์นี้"
      />

      <div className="fixed inset-0 z-[140]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <div className="text-lg font-semibold text-zinc-900">
                  คืนอุปกรณ์ด่วน
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  เลือกอีเวนต์และอุปกรณ์ที่จะคืน พร้อมหลักฐานรูปภาพ
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
                    setIsDamaged(false);
                    setPhotos([]);
                  }}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-100"
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
                  อุปกรณ์ที่จะคืน ({items.length})
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
                <div className="flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                  <Package2 className="h-8 w-8 text-zinc-300" />
                  <div className="mt-2 text-sm text-zinc-400">
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

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={isDamaged}
                  onChange={(e) => setIsDamaged(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-red-600"
                />
                <span>อุปกรณ์มีความเสียหาย/ชำรุด</span>
              </label>

              {!isDamaged ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-800">
                      อุปกรณ์อยู่ในสภาพดี
                    </div>
                    <div className="text-xs text-emerald-600">
                      ไม่พบความเสียหาย
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <div className="text-sm font-semibold text-red-800">
                      พบความเสียหาย
                    </div>
                    <div className="text-xs text-red-600">
                      กรุณาอัปโหลดรูปหลักฐานก่อนยืนยัน
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 text-sm font-semibold text-zinc-800">
                  รูปภาพหลักฐาน{" "}
                  {isDamaged ? (
                    <span className="text-red-600">*</span>
                  ) : (
                    <span className="font-normal text-zinc-400">
                      (ไม่บังคับ)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    <Camera className="h-4 w-4" />
                    เปิดกล้อง
                  </button>

                  <button
                    type="button"
                    onClick={() => uploadRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    <Upload className="h-4 w-4" />
                    อัปโหลดรูป
                  </button>
                </div>

                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(e.target.files)}
                />

                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => addPhotos(e.target.files)}
                />

                <div className="mt-2 min-h-[80px] rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-3">
                  {photos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-4 text-center">
                      <Camera className="h-8 w-8 text-zinc-300" />
                      <div className="mt-2 text-xs text-zinc-400">
                        {isDamaged
                          ? "ต้องอัปโหลดรูปอย่างน้อย 1 รูป"
                          : "ถ่ายหรืออัปโหลดรูปเพิ่มเติมได้"}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((f, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-600"
                        >
                          <div className="truncate font-medium">{f.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                    void onConfirm(selectedEventId, items, isDamaged, photos);
                    onClose();
                  }}
                  disabled={!canConfirm}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  ยืนยันการคืน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
