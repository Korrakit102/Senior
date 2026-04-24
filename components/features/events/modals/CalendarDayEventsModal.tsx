"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { EventItem } from "../types";
import EventStatusPill from "../components/EventStatusPill";
import { fmtDateRangeThai } from "../helpers";

export default function CalendarDayEventsModal({
  open,
  dateLabel,
  events,
  onClose,
}: {
  open: boolean;
  dateLabel: string;
  events: EventItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                รายการ Event วันที่ {dateLabel}
              </div>
              <div className="mt-1 text-sm text-zinc-500">ทั้งหมด {events.length} รายการ</div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                ไม่มีรายการในวันนี้
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          {ev.title}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{ev.code}</div>
                      </div>
                      <EventStatusPill tone={ev.status.tone} text={ev.status.text} />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs text-zinc-400">บริษัท</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">{ev.company}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">สถานที่</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">{ev.place}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">วันจัดงาน</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">{fmtDateRangeThai(ev.date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">อุปกรณ์</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">{ev.items}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-zinc-400">รายละเอียด</div>
                      <div className="mt-1 text-sm text-zinc-700">{ev.desc || "-"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}