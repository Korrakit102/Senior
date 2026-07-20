"use client";

import React from "react";
import { Trash2, X } from "lucide-react";

type Props = {
  open: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteEventModal({
  open,
  eventTitle,
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
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                ยืนยันการลบอีเวนต์
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                กรุณาตรวจสอบก่อนลบรายการ
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-red-600 ring-1 ring-red-200">
                  <Trash2 className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">
                    คุณต้องการลบอีเวนต์นี้ใช่หรือไม่?
                  </div>
                  <div className="mt-1 text-sm text-zinc-700">
                    <span className="font-semibold text-red-600">
                      {eventTitle}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    หากอีเวนต์นี้เคยอนุมัติอุปกรณ์แล้ว ระบบจะคืนจำนวนอุปกรณ์กลับเข้าสต็อก
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>

              <button
                onClick={onConfirm}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                ลบอีเวนต์
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
