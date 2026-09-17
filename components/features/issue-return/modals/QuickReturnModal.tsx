"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  Package2,
  Upload,
  X,
} from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { EquipmentItem, EventEquipmentItem, IssueEvent } from "../types";
import CameraCaptureModal from "./CameraCaptureModal";

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(open);

  React.useEffect(() => {
    if (!open) {
      setItems([]);
      setSelectedEventId("");
      setIsDamaged(false);
      setPhotos([]);
      setIsCameraOpen(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCameraOpen) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isCameraOpen]);

  const selectedEventEquipment = useMemo(
    () => (selectedEventId ? eventEquipmentById[selectedEventId] ?? [] : []),
    [eventEquipmentById, selectedEventId]
  );

  const makeReturnItemId = (name: string) => `${selectedEventId}-${name}`;

  const toggleReturnItem = (item: EventEquipmentItem, checked: boolean) => {
    setItems((prev) => {
      if (!checked) return prev.filter((selected) => selected.name !== item.name);
      if (prev.some((selected) => selected.name === item.name)) return prev;
      return [
        ...prev,
        {
          id: makeReturnItemId(item.name),
          name: item.name,
          qty: item.qty,
        },
      ];
    });
  };

  const updateReturnQty = (item: EventEquipmentItem, value: string) => {
    const qty = Math.min(item.qty, Math.max(1, Number(value) || 1));
    setItems((prev) =>
      prev.map((selected) =>
        selected.name === item.name ? { ...selected, qty } : selected
      )
    );
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)]);
  };

  const addCameraPhoto = (file: File) => {
    setPhotos((prev) => [...prev, file]);
  };

  const canConfirm =
    Boolean(selectedEventId) &&
    items.length > 0 &&
    (!isDamaged || photos.length > 0);

  if (!open) return null;

  return (
    <>
      <CameraCaptureModal
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={addCameraPhoto}
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
                  เลือกอีเวนต์และเลือกอุปกรณ์ที่จะคืน พร้อมหลักฐานรูปภาพ
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

              <div>
                <div className="mb-2 text-sm font-semibold text-zinc-800">
                  เลือกอุปกรณ์ที่จะคืน ({items.length})
                </div>

                {!selectedEventId ? (
                  <div className="flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                    <Package2 className="h-8 w-8 text-zinc-300" />
                    <div className="mt-2 text-sm text-zinc-400">
                      กรุณาเลือกอีเวนต์ก่อน
                    </div>
                  </div>
                ) : selectedEventEquipment.length === 0 ? (
                  <div className="flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                    <Package2 className="h-8 w-8 text-zinc-300" />
                    <div className="mt-2 text-sm text-zinc-400">
                      ไม่มีอุปกรณ์ค้างอยู่ในอีเวนต์นี้
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                    {selectedEventEquipment.map((equipment) => {
                      const selected = items.find((item) => item.name === equipment.name);
                      const checked = Boolean(selected);

                      return (
                        <div
                          key={equipment.name}
                          className={[
                            "rounded-xl border px-4 py-3",
                            checked
                              ? "border-blue-200 bg-blue-50"
                              : "border-zinc-200 bg-white",
                          ].join(" ")}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleReturnItem(equipment, e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-zinc-300 accent-blue-600"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-zinc-900">
                                {equipment.name}
                              </div>
                              <div className="text-xs text-zinc-500">
                                ค้างอยู่ในอีเวนต์: {equipment.qty} ชิ้น
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-500">
                                คืน
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={equipment.qty}
                                disabled={!checked}
                                value={selected?.qty ?? equipment.qty}
                                onChange={(e) => updateReturnQty(equipment, e.target.value)}
                                className="h-9 w-20 rounded-xl border border-zinc-200 bg-white px-2 text-center text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100 disabled:text-zinc-400"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                    onClick={() => setIsCameraOpen(true)}
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
                      {photos.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-600"
                        >
                          <div className="truncate font-medium">{file.name}</div>
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
