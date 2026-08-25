"use client";

import React from "react";
import { Upload, X } from "lucide-react";

type Props = {
  open: boolean;
  fileName: string;
  previewUrl: string | null;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmUploadReceiptModal({
  open,
  fileName,
  previewUrl,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Props) {
  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                ยืนยันการแนบสลิป
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                กรุณาตรวจสอบไฟล์ก่อนอัปโหลด
              </div>
            </div>

            <button
              onClick={onCancel}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">
                ต้องการแนบสลิปไฟล์นี้ใช่หรือไม่?
              </div>

              {previewUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="ตัวอย่างสลิป"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              )}

              <div className="mt-3 truncate text-sm text-zinc-700">
                <span className="font-semibold text-emerald-700">ไฟล์: </span>
                {fileName}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {isSubmitting ? "กำลังแนบ..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
