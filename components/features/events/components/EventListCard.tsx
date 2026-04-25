import { Eye, Package, Trash2, Lock } from "lucide-react";
import EventStatusPill from "./EventStatusPill";
import type { EventItem, Role } from "../types";
import { fmtDateRangeThai } from "../helpers";

type EventListCardProps = {
  event: EventItem;
  role: Role;
  onOpenDetail: (eventId: string) => void;
  onManageItems: (eventId: string) => void;
  onDelete: (eventId: string) => void;
};

export default function EventListCard({
  event,
  role,
  onOpenDetail,
  onManageItems,
  onDelete,
}: EventListCardProps) {
  // ✅ ล็อคปุ่มแก้ไขเมื่อ stockkeeper Issue ไปแล้ว
  const isLocked = event.isIssued === true;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate text-base font-semibold text-zinc-900">
              {event.title}
            </h2>
            <EventStatusPill
              tone={event.status.tone}
              text={event.status.text}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="text-zinc-400">{event.code}</span>
            <span className="text-zinc-300">•</span>
            <span className="min-w-0 truncate">{event.desc || "-"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่มดูรายละเอียด */}
          <button
            className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-700 shadow-sm hover:bg-zinc-50"
            onClick={() => onOpenDetail(event.id)}
            title="ดูรายละเอียด"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* ✅ ปุ่มจัดการอุปกรณ์ */}
          {role === "Manager" && (event.status.tone === "pending" || event.status.tone === "success") && (
            isLocked ? (
              // ล็อคแล้ว - stockkeeper Issue ไปแล้ว
              <div
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-400 cursor-not-allowed"
                title="ไม่สามารถแก้ไขได้ เนื่องจาก stockkeeper เบิกอุปกรณ์ไปแล้ว"
              >
                <Lock className="h-4 w-4" />
                จัดการอุปกรณ์
              </div>
            ) : (
              // ยังแก้ไขได้
              <button
                onClick={() => onManageItems(event.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                title="จัดการอุปกรณ์"
              >
                <Package className="h-4 w-4" />
                จัดการอุปกรณ์
              </button>
            )
          )}

          {/* ปุ่มลบ - SA เห็น แต่ไม่แสดงเมื่ออุปกรณ์ถูกเบิกออกไปแล้ว */}
          {role === "SA" && !isLocked && (
            <button
              onClick={() => onDelete(event.id)}
              className="rounded-2xl border border-red-200 bg-white p-2.5 text-red-600 shadow-sm hover:bg-red-50"
              title="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-zinc-400">บริษัท</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{event.company}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">สถานที่</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{event.place}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">วันจัดงาน</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{fmtDateRangeThai(event.date)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">อุปกรณ์</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-900">
            {event.items}
            {/* ✅ badge เบิกแล้ว */}
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                <Lock className="h-3 w-3" />เบิกแล้ว
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
