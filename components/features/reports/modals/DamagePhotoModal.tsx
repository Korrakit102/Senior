"use client";

import React from "react";
import { ImageOff, X } from "lucide-react";

type Props = {
  open: boolean;
  itemName: string;
  photos: string[];
  onClose: () => void;
};

export default function DamagePhotoModal({ open, itemName, photos, onClose }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">รูปหลักฐานความเสียหาย</div>
              <div className="mt-1 text-sm text-zinc-500">{itemName}</div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {photos.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-zinc-400">
                <ImageOff className="h-8 w-8" />
                <div className="text-sm">ไม่มีรูปภาพ</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((src, i) => (
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
      </div>
    </div>
  );
}
