"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Props = {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteModal({
  open,
  itemName,
  onConfirm,
  onCancel,
}: Props) {
  useBodyScrollLock(open);

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
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            <div className="mt-4 text-center">
              <div className="text-base font-semibold text-zinc-900">
                ยืนยันการลบอุปกรณ์
              </div>
              <div className="mt-2 text-sm text-zinc-500">
                คุณต้องการลบ{" "}
                <span className="font-semibold text-zinc-800">
                  "{itemName}"
                </span>{" "}
                ใช่หรือไม่?
              </div>
              <div className="mt-1 text-xs text-red-500">
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-10 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
