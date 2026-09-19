"use client";

import React from "react";
import { ImageOff, X } from "lucide-react";
import type { DamageRow } from "../types";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Props = {
  open: boolean;
  row: DamageRow | null;
  onClose: () => void;
};

// รวมรูปหลักฐาน + เลขที่ดำเนินการ + หมายเหตุ ของรายการความเสียหายหนึ่งแถว ไว้ในที่เดียว
// เปิดจากปุ่มเมนู (kebab) ในตารางรายงานความเสียหาย
export default function DamageDetailsModal({ open, row, onClose }: Props) {
  useBodyScrollLock(open);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  const photoPaths = row.photoPaths ?? [];

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">รายละเอียดเพิ่มเติม</div>
              <div className="mt-1 text-sm text-zinc-500">{row.itemName}</div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5">
            <div>
              <div className="text-xs font-semibold text-zinc-500">รูปภาพหลักฐาน</div>
              <div className="mt-2">
                {photoPaths.length === 0 ? (
                  <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 text-zinc-400">
                    <ImageOff className="h-7 w-7" />
                    <div className="text-sm">ไม่มีรูปภาพ</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {photoPaths.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square overflow-hidden rounded-xl border border-zinc-200 hover:opacity-80"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <div className="text-xs font-semibold text-zinc-500">เลขที่ดำเนินการ</div>
              <div className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-700">
                {row.resolvedCodes?.trim() || "-"}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <div className="text-xs font-semibold text-zinc-500">หมายเหตุ</div>
              <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
                {row.note?.trim() || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
