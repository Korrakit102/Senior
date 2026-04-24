import { ChevronLeft, ChevronRight } from "lucide-react";
import EventDayLegendDot from "./EventDayLegendDot";
import { formatMonthThai, getCalendarEventToneClass, toYMD } from "../helpers";
import type { EventItem } from "../types";

type CalendarCell = {
  date: Date;
  inMonth: boolean;
};

type EventsCalendarProps = {
  monthCursor: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  calendarGrid: CalendarCell[];
  todayKey: string;
  eventsByDay: Record<string, EventItem[]>;
  onOpenDayEvents: (payload: { dateKey: string; events: EventItem[] }) => void;
};

export default function EventsCalendar({
  monthCursor,
  onPrevMonth,
  onNextMonth,
  calendarGrid,
  todayKey,
  eventsByDay,
  onOpenDayEvents,
}: EventsCalendarProps) {
  return (
    <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-semibold text-zinc-900">
          {formatMonthThai(monthCursor)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
            title="เดือนก่อน"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={onNextMonth}
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
            title="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <EventDayLegendDot cls="bg-rose-500" label="วันที่มี Event" />
        <EventDayLegendDot cls="bg-blue-500" label="วันนี้" />
        <EventDayLegendDot cls="bg-amber-500" label="รออนุมัติ" />
        <EventDayLegendDot cls="bg-emerald-500" label="อนุมัติแล้ว" />
        <EventDayLegendDot cls="bg-violet-500" label="กำลังใช้งาน" />
        <EventDayLegendDot cls="bg-rose-500" label="ไม่อนุมัติ" />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-3 text-xs font-semibold text-zinc-500">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((w) => (
          <div key={w} className="px-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-3">
        {calendarGrid.map(({ date, inMonth }, idx) => {
          const key = toYMD(date);
          const isToday = key === todayKey;
          const dayEvents = eventsByDay[key] ?? [];
          const visibleDayEvents = dayEvents.slice(0, 2);
          const moreCount = Math.max(0, dayEvents.length - visibleDayEvents.length);
          const hasEvent = dayEvents.length > 0;

          return (
            <div
              key={`${key}-${idx}`}
              className={[
                "min-h-[120px] rounded-2xl border p-3 transition",
                inMonth ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50",
                isToday ? "ring-2 ring-blue-500/30 bg-blue-50/40" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between">
                <div
                  className={[
                    "text-sm font-semibold",
                    inMonth ? "text-zinc-900" : "text-zinc-400",
                    isToday ? "text-blue-700" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </div>

                <div className="flex items-center gap-1">
                  {hasEvent && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
                  {isToday && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                </div>
              </div>

              <div className="mt-2 space-y-1.5">
                {visibleDayEvents.map((event) => (
                  <button
                    key={`${key}-${event.id}`}
                    type="button"
                    onClick={() =>
                      onOpenDayEvents({
                        dateKey: key,
                        events: dayEvents,
                      })
                    }
                    className={[
                      "block w-full truncate rounded-lg border-l-4 px-2 py-1 text-left text-[11px] font-medium",
                      event.isIssued
                        ? "border-l-violet-500 bg-violet-50 text-violet-700"
                        : getCalendarEventToneClass(event.status.tone),
                      !inMonth ? "opacity-60" : "",
                    ].join(" ")}
                    title={`${event.title} • ${event.isIssued ? "กำลังใช้งาน" : event.status.text}`}
                  >
                    {event.title}
                  </button>
                ))}

                {moreCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenDayEvents({
                        dateKey: key,
                        events: dayEvents,
                      })
                    }
                    className="px-1 text-left text-[11px] font-medium text-zinc-500 hover:text-zinc-700 hover:underline"
                  >
                    +{moreCount} รายการ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}