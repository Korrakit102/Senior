"use client";

import React, { useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle, Package, Upload, X } from "lucide-react";
import type { IssueEvent, ReturnItemResult } from "../types";
import CameraCaptureModal from "./CameraCaptureModal";

type ItemDamageInfo = {
  damaged: boolean;
  damagedQty: number;
  photos: File[];
};

type Props = {
  open: boolean;
  event: IssueEvent | null;
  equipmentItems: { name: string; qty: number }[];
  onConfirm: (items: ReturnItemResult[]) => void;
  onCancel: () => void;
};

export default function ConfirmReturnModal({
  open,
  event,
  equipmentItems,
  onConfirm,
  onCancel,
}: Props) {
  const [itemDamage, setItemDamage] = useState<Record<string, ItemDamageInfo>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setItemDamage({});
      setActiveItem(null);
      setIsCameraOpen(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCameraOpen) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, isCameraOpen]);

  const addPhotos = (itemName: string, files: FileList | null, totalQty: number) => {
    if (!files) return;
    appendPhotos(itemName, Array.from(files), totalQty);
  };

  const appendPhotos = (itemName: string, files: File[], totalQty: number) => {
    if (files.length === 0) return;
    setItemDamage((prev) => {
      const info = prev[itemName] ?? { damaged: true, damagedQty: totalQty, photos: [] };
      return { ...prev, [itemName]: { ...info, photos: [...info.photos, ...files] } };
    });
  };

  const addCameraPhoto = (file: File) => {
    if (!activeItem) return;
    const totalQty = equipmentItems.find((i) => i.name === activeItem)?.qty ?? 1;
    appendPhotos(activeItem, [file], totalQty);
  };

  const removePhoto = (itemName: string, idx: number) => {
    setItemDamage((prev) => {
      const info = prev[itemName];
      if (!info) return prev;
      return { ...prev, [itemName]: { ...info, photos: info.photos.filter((_, i) => i !== idx) } };
    });
  };

  const damagedCount = equipmentItems.filter((item) => itemDamage[item.name]?.damaged).length;
  const anyDamaged = damagedCount > 0;

  const canConfirm = equipmentItems.every((item) => {
    const info = itemDamage[item.name];
    if (!info?.damaged) return true;
    return info.photos.length > 0;
  });

  const handleConfirm = () => {
    const result: ReturnItemResult[] = equipmentItems.map((item) => ({
      name: item.name,
      qty: item.qty,
      damaged: itemDamage[item.name]?.damaged ?? false,
      damagedQty: itemDamage[item.name]?.damagedQty ?? item.qty,
      photos: itemDamage[item.name]?.photos ?? [],
    }));
    onConfirm(result);
  };

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <CameraCaptureModal
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={addCameraPhoto}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">ยืนยันการคืนอุปกรณ์</div>
              <div className="mt-1 text-sm text-zinc-500">"{event.title}"</div>
            </div>
            <button
              onClick={onCancel}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <div className="space-y-3">
              {/* Status banner */}
              {!anyDamaged ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-800">อุปกรณ์ทุกชิ้นอยู่ในสภาพดี</div>
                    <div className="text-xs text-emerald-600">
                      เลือก "เสียหาย" ที่รายการด้านล่างหากพบความเสียหาย
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <div className="text-sm font-semibold text-red-800">
                      พบความเสียหาย {damagedCount} รายการ
                    </div>
                    <div className="text-xs text-red-600">
                      กรุณาอัปโหลดรูปหลักฐานสำหรับทุกรายการที่เสียหาย
                    </div>
                  </div>
                </div>
              )}

              {/* Equipment item list */}
              {equipmentItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
                  ไม่มีข้อมูลรายการอุปกรณ์
                </div>
              ) : (
                <div className="space-y-2">
                  {equipmentItems.map((item) => {
                    const info = itemDamage[item.name];
                    const isDamaged = info?.damaged ?? false;
                    const damagedQty = info?.damagedQty ?? item.qty;
                    const photos = info?.photos ?? [];
                    const needsPhoto = isDamaged && photos.length === 0;

                    return (
                      <div
                        key={item.name}
                        className={`rounded-xl border p-4 transition-colors ${
                          isDamaged ? "border-red-200 bg-red-50/40" : "border-zinc-200 bg-white"
                        }`}
                      >
                        {/* Item row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-zinc-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-zinc-500">{item.qty} ชิ้น</div>
                            </div>
                          </div>

                          <label
                            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                              isDamaged
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDamaged}
                              onChange={(e) =>
                                setItemDamage((prev) => ({
                                  ...prev,
                                  [item.name]: {
                                    ...(prev[item.name] ?? { damaged: false, damagedQty: item.qty, photos: [] }),
                                    damaged: e.target.checked,
                                    damagedQty: prev[item.name]?.damagedQty ?? item.qty,
                                  },
                                }))
                              }
                              className="h-4 w-4 accent-red-600"
                            />
                            <span className="font-semibold">เสียหาย</span>
                          </label>
                        </div>

                        {/* Damaged qty + photo section */}
                        {isDamaged && (
                          <div className="mt-3 space-y-2">
                            {/* Damaged quantity input */}
                            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-white px-3 py-2">
                              <span className="shrink-0 text-xs font-semibold text-zinc-700">
                                จำนวนที่เสียหาย
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={item.qty}
                                value={damagedQty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = Math.min(
                                    item.qty,
                                    Math.max(1, Math.floor(Number(e.target.value)) || 1)
                                  );
                                  setItemDamage((prev) => ({
                                    ...prev,
                                    [item.name]: {
                                      ...(prev[item.name] ?? { damaged: true, damagedQty: item.qty, photos: [] }),
                                      damagedQty: val,
                                    },
                                  }));
                                }}
                                className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-center text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-red-100"
                              />
                              <span className="text-xs text-zinc-500">/ {item.qty} ชิ้น</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveItem(item.name);
                                  setIsCameraOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                              >
                                <Camera className="h-4 w-4" />
                                เปิดกล้อง
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveItem(item.name);
                                  uploadRef.current?.click();
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                              >
                                <Upload className="h-4 w-4" />
                                อัปโหลดรูป
                              </button>
                            </div>

                            {photos.length === 0 ? (
                              <div
                                className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                  needsPhoto
                                    ? "border-red-200 bg-red-50 text-red-600"
                                    : "border-zinc-200 text-zinc-400"
                                }`}
                              >
                                {needsPhoto
                                  ? "⚠ ต้องอัปโหลดรูปหลักฐานอย่างน้อย 1 รูป"
                                  : "ยังไม่มีรูปภาพ"}
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {photos.map((f, i) => (
                                  <div
                                    key={i}
                                    className="group relative rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2"
                                  >
                                    <div className="truncate text-xs font-medium text-zinc-600">
                                      {f.name}
                                    </div>
                                    <button
                                      onClick={() => removePhoto(item.name, i)}
                                      className="absolute -right-1 -top-1 hidden h-5 w-5 place-items-center rounded-full bg-red-500 text-white group-hover:grid"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onCancel}
                  className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="h-10 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ยืนยันการคืน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shared hidden file inputs */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (activeItem) {
            const totalQty = equipmentItems.find((i) => i.name === activeItem)?.qty ?? 1;
            addPhotos(activeItem, e.target.files, totalQty);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
