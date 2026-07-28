"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock3,
  ThumbsUp,
} from "lucide-react";
import type { StockRow } from "../../AppShell";

import EventStatCard from "./components/EventStatCard";
import EventsHeader from "./components/EventsHeader";
import EventsToolbar from "./components/EventsToolbar";
import EventsViewToggle from "./components/EventsViewToggle";
import EventsList from "./components/EventsList";
import EventsCalendar from "./components/EventsCalendar";

import CreateEventModal from "./modals/CreateEventModal";
import ManageEquipmentModal from "./modals/ManageEquipmentModal";
import CalendarDayEventsModal from "./modals/CalendarDayEventsModal";
import EventDetailModal from "./modals/EventDetailModal";
import ConfirmDeleteEventModal from "./modals/ConfirmDeleteEventModal";

import { statusOptions } from "./constants";
import { parseDateRange, toDateLocal, toYMD } from "./helpers";
import type {
  EventApiItem,
  EventItem,
  NotificationItem,
  Role,
  SelectedEquipment,
} from "./types";

function canShowEventForRole(
  event: EventItem,
  role: Role,
  issuedEventIds: Set<string>
) {
  if (role !== "Stockkeeper") return true;

  return (
    event.status.tone === "success" ||
    event.status.tone === "progress" ||
    event.isIssued === true ||
    issuedEventIds.has(event.id)
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function EventsPage({
  role,
  stockData,
  onDeductStock,
  onReturnStock,
  issuedEventIds = new Set<string>(),
}: {
  role: Role;
  stockData: StockRow[];
  onDeductStock: (equipmentList: { name: string; qty: number }[]) => void;
  onReturnStock: (equipmentList: { name: string; qty: number }[]) => void;
  issuedEventIds?: Set<string>;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("สถานะทั้งหมด");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const statusRef = useRef<HTMLDivElement | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [equipmentByEvent, setEquipmentByEvent] = useState<Record<string, SelectedEquipment[]>>({});

  const [manageEventId, setManageEventId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const [calendarDetail, setCalendarDetail] = useState<{
    dateKey: string;
    events: EventItem[];
  } | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!isStatusOpen || !statusRef.current) return;
      if (!statusRef.current.contains(e.target as Node)) setIsStatusOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsStatusOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [isStatusOpen]);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await fetch(`/api/events?role=${encodeURIComponent(role)}`);
        if (!res.ok) throw new Error("failed to fetch events");
        const rows = (await res.json()) as EventApiItem[];

        setEvents(rows.map((r) => {
          const { startStr, endStr } = parseDateRange(r.date);
          const startDate = toDateLocal(startStr);
          const endDate = toDateLocal(endStr);
          const safeDate =
            !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
              ? `${toYMD(startDate)} - ${toYMD(endDate)}`
              : r.date;
          return {
            id: r.id, title: r.title, status: r.status, code: r.code,
            createdAt: r.createdAt, desc: r.desc, company: r.company,
            place: r.place, date: safeDate, items: r.items,
            organizer: r.organizer, contactName: r.contactName,
            contactPhone: r.contactPhone, branchCode: r.branchCode,
            budgetTHB: r.budgetTHB, attendees: r.attendees,
            isIssued: r.issueStatus === "inuse",
            paymentReceipt: r.paymentReceipt,
          };
        }));

        const equipmentMap: Record<string, SelectedEquipment[]> = {};
        for (const row of rows) {
          equipmentMap[row.id] = Array.isArray(row.equipment) ? row.equipment : [];
        }
        setEquipmentByEvent(equipmentMap);
      } catch {
        setToast("ไม่สามารถโหลดข้อมูลอีเวนต์จากฐานข้อมูลได้");
      } finally {
        setIsLoadingEvents(false);
      }
    };
    loadEvents();
  }, [role]);

  // ✅ รับ signal จาก IssueReturn ว่ามี Event ที่ Return แล้ว → reload ข้อมูลใหม่
  useEffect(() => {
    const onReload = () => {
      const loadEvents = async () => {
        try {
          const res = await fetch(`/api/events?role=${encodeURIComponent(role)}`);
          if (!res.ok) return;
          const rows = (await res.json()) as EventApiItem[];
          setEvents(rows.map((r) => {
            const { startStr, endStr } = parseDateRange(r.date);
            const startDate = toDateLocal(startStr);
            const endDate = toDateLocal(endStr);
            const safeDate =
              !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
                ? `${toYMD(startDate)} - ${toYMD(endDate)}`
                : r.date;
            return {
              id: r.id, title: r.title, status: r.status, code: r.code,
              createdAt: r.createdAt, desc: r.desc, company: r.company,
              place: r.place, date: safeDate, items: r.items,
              organizer: r.organizer, contactName: r.contactName,
              contactPhone: r.contactPhone, branchCode: r.branchCode,
              budgetTHB: r.budgetTHB, attendees: r.attendees,
              isIssued: r.issueStatus === "inuse",
              paymentReceipt: r.paymentReceipt,
            };
          }));
        } catch { /* silent */ }
      };
      loadEvents();
    };
    window.addEventListener("app:event:returned", onReload);
    return () => window.removeEventListener("app:event:returned", onReload);
  }, [role]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const roleEvents = useMemo(
    () => events.filter((event) => canShowEventForRole(event, role, issuedEventIds)),
    [events, role, issuedEventIds]
  );

  const roleStatusOptions = useMemo<readonly string[]>(
    () =>
      role === "Stockkeeper"
        ? statusOptions.filter(
            (option) =>
              option !== "รออนุมัติ" &&
              option !== "ไม่อนุมัติ" &&
              option !== "รอชำระเงิน" &&
              option !== "รอตรวจสอบการชำระเงิน"
          )
        : statusOptions,
    [role]
  );

  useEffect(() => {
    if (!roleStatusOptions.includes(statusFilter)) {
      setStatusFilter("สถานะทั้งหมด");
    }
  }, [roleStatusOptions, statusFilter]);

  const companyOptions = useMemo(
    () => Array.from(new Set(roleEvents.map((e) => e.company))).sort((a, b) => a.localeCompare(b)),
    [roleEvents]
  );

  const pushNotification = (data: { title: string; message: string; audience: Role[] }) => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) throw new Error("fail");
      const r = await res.json();
      const notif: NotificationItem = {
        id: r.id, createdAt: r.createdAt, title: data.title,
        message: data.message, audience: data.audience,
        unreadFor: data.audience, timeISO: r.createdAt,
      };
      window.dispatchEvent(new CustomEvent("app:notification:new", { detail: notif }));
    }).catch(() => {});
  };

  const stats = useMemo(() => {
    const total = roleEvents.length;
    const pending = roleEvents.filter((e) => e.status.text === "รออนุมัติ").length;
    const progress = roleEvents.filter(
      (e) => e.status.tone === "progress" || e.isIssued === true || issuedEventIds.has(e.id)
    ).length;
    const approved = roleEvents.filter(
      (e) => e.status.tone === "success" && e.isIssued !== true && !issuedEventIds.has(e.id)
    ).length;
    return [
      { label: "ทั้งหมด", value: total, tone: "neutral" as const, icon: <Archive className="h-5 w-5" /> },
      { label: "รออนุมัติ", value: pending, tone: "amber" as const, icon: <Clock3 className="h-5 w-5" /> },
      { label: "อนุมัติแล้ว", value: approved, tone: "emerald" as const, icon: <ThumbsUp className="h-5 w-5" /> },
      { label: "กำลังดำเนินการ", value: progress, tone: "sky" as const, icon: <CheckCircle2 className="h-5 w-5" /> },
    ];
  }, [roleEvents, issuedEventIds]);

  const visibleEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = statusFilter === "สถานะทั้งหมด"
      ? roleEvents
      : roleEvents.filter((e) => e.status.text === statusFilter);
    const searched = !keyword ? filtered : filtered.filter((e) =>
      [e.title, e.company, e.place, e.desc, e.organizer ?? "", e.contactName ?? "", e.contactPhone ?? "", e.code]
        .join(" ").toLowerCase().includes(keyword)
    );
    return [...searched].sort((a, b) => {
      const aCreated = new Date(a.createdAt).getTime();
      const bCreated = new Date(b.createdAt).getTime();
      if (aCreated !== bCreated) return bCreated - aCreated;
      return b.id.localeCompare(a.id);
    });
  }, [roleEvents, search, statusFilter]);

  // ✅ map isIssued เข้าไปใน visibleEvents (รวม DB + session)
  const visibleEventsWithIssued = useMemo(
    () => visibleEvents.map((e) => ({ ...e, isIssued: e.isIssued === true || issuedEventIds.has(e.id) })),
    [visibleEvents, issuedEventIds]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of visibleEventsWithIssued) {
      const { startStr, endStr } = parseDateRange(e.date);
      const start = toDateLocal(startStr);
      const end = toDateLocal(endStr);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cur <= end) {
        const key = toYMD(cur);
        if (!map[key]) map[key] = [];
        map[key].push(e);
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
    }
    return map;
  }, [visibleEventsWithIssued]);

  const calendarGrid = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startOffset = first.getDay();
    const totalDays = last.getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: new Date(y, m, 1 - (startOffset - i)), inMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(y, m, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const lastCell = cells[cells.length - 1].date;
      cells.push({ date: new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [monthCursor]);

  const todayKey = useMemo(() => toYMD(new Date()), []);

  const detailEvent = useMemo(() => {
    if (!detailEventId) return null;
    return events.find((e) => e.id === detailEventId) ?? null;
  }, [detailEventId, events]);

  const detailEquipment = useMemo(() => {
    return detailEventId ? equipmentByEvent[detailEventId] ?? [] : [];
  }, [detailEventId, equipmentByEvent]);

  const activeEvent = useMemo(() => {
    if (!manageEventId) return null;
    return events.find((e) => e.id === manageEventId) ?? null;
  }, [manageEventId, events]);

  const deleteEvent = useMemo(() => {
    if (!deleteEventId) return null;
    return events.find((e) => e.id === deleteEventId) ?? null;
  }, [deleteEventId, events]);

  const onManageItems = (eventId: string) => { setManageEventId(eventId); setIsManageOpen(true); };
  const onDeleteEvent = (eventId: string) => { setDeleteEventId(eventId); };

  const handleConfirmDeleteEvent = async () => {
    if (!deleteEventId) return;
    const target = events.find((ev) => ev.id === deleteEventId);
    if (!target) { setDeleteEventId(null); return; }
    try {
      const res = await fetch(`/api/events/${deleteEventId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to delete event");
    } catch {
      setToast("ไม่สามารถลบอีเวนต์ได้");
      return;
    }
    if (target.status.tone === "success" && equipmentByEvent[deleteEventId]) {
      onReturnStock(equipmentByEvent[deleteEventId].map((eq) => ({ name: eq.name, qty: eq.qty })));
    }
    setEvents((prev) => prev.filter((ev) => ev.id !== deleteEventId));
    setEquipmentByEvent((prev) => {
      if (!(deleteEventId in prev)) return prev;
      const next = { ...prev };
      delete next[deleteEventId];
      return next;
    });
    if (manageEventId === deleteEventId) { setIsManageOpen(false); setManageEventId(null); }
    setCalendarDetail((prev) => {
      if (!prev) return prev;
      const nextEvents = prev.events.filter((ev) => ev.id !== deleteEventId);
      if (nextEvents.length === 0) return null;
      return { ...prev, events: nextEvents };
    });
    if (detailEventId === deleteEventId) setDetailEventId(null);
    setToast(`ลบอีเวนต์เรียบร้อย: "${target.title}"`);
    setDeleteEventId(null);
  };

  const handleCreate = async (payload: {
    title: string; company: string; organizer: string;
    contactName: string; contactPhone: string; branchCode?: string;
    budgetTHB?: number; desc?: string; attendees?: number;
    place: string; startDate: string; endDate: string;
  }) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title, company: payload.company, organizer: payload.organizer,
          contactName: payload.contactName, contactPhone: payload.contactPhone,
          branchCode: payload.branchCode, budgetTHB: payload.budgetTHB,
          desc: payload.desc, attendees: payload.attendees,
          place: payload.place, startDate: payload.startDate, endDate: payload.endDate,
        }),
      });
      if (!res.ok) throw new Error("failed to create event");
      const created = (await res.json()) as { id: string; createdAt: string };
      const newEvent: EventItem = {
        id: created.id, code: `#${created.id}`, createdAt: created.createdAt,
        title: payload.title, company: payload.company, place: payload.place,
        desc: payload.desc ?? "", date: `${payload.startDate} - ${payload.endDate}`,
        items: "0 รายการ", status: { text: "รออนุมัติ", tone: "pending" },
        organizer: payload.organizer, contactName: payload.contactName,
        contactPhone: payload.contactPhone, branchCode: payload.branchCode,
        budgetTHB: payload.budgetTHB, attendees: payload.attendees,
        paymentReceipt: undefined,
      };
      setEvents((prev) => [newEvent, ...prev]);
      setEquipmentByEvent((prev) => ({ ...prev, [created.id]: [] }));
      setView("list");
      setToast(`สร้างอีเวนต์เรียบร้อย: "${payload.title}"`);
      if (role === "SA") {
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "มีอีเวนต์ใหม่รออนุมัติ",
            message: `${payload.title} สร้างโดยลูกค้า รอการอนุมัติ`,
            audience: ["Manager"],
          }),
        }).catch(() => {});
      }
    } catch {
      setToast("ไม่สามารถสร้างอีเวนต์ได้");
    }
  };

  const handleUploadReceipt = async (eventId: string, file: File) => {
    const targetEvent = events.find((event) => event.id === eventId);

    if (file.size > 2 * 1024 * 1024) {
      setToast("ไฟล์ใบเสร็จต้องไม่เกิน 2MB");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentAction: "uploadReceipt",
          fileName: file.name,
          fileType: file.type,
          dataUrl,
        }),
      });
      if (!res.ok) throw new Error("failed to upload receipt");

      const data = (await res.json()) as {
        status: EventItem["status"];
        paymentReceipt: NonNullable<EventItem["paymentReceipt"]>;
      };

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: data.status,
                paymentReceipt: data.paymentReceipt,
              }
            : event
        )
      );

      pushNotification({
        title: "ลูกค้าแนบใบเสร็จแล้ว",
        message: `${targetEvent?.title ?? "อีเวนต์"} รอผู้จัดการตรวจสอบการชำระเงิน`,
        audience: ["Manager"],
      });
      setToast(`แนบใบเสร็จแล้ว: "${targetEvent?.title ?? "อีเวนต์"}"`);
    } catch {
      setToast("ไม่สามารถแนบใบเสร็จได้");
    }
  };

  const handleConfirmPayment = async (eventId: string) => {
    const targetEvent = events.find((event) => event.id === eventId);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAction: "confirmPayment" }),
      });
      if (!res.ok) throw new Error("failed to confirm payment");

      const data = (await res.json()) as { status: EventItem["status"] };

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: data.status,
              }
            : event
        )
      );

      pushNotification({
        title: "ยืนยันการชำระเงินแล้ว",
        message: `${targetEvent?.title ?? "อีเวนต์"} ชำระเงินเรียบร้อยและปิดงานแล้ว`,
        audience: ["SA"],
      });
      setToast(`ยืนยันการชำระเงินแล้ว: "${targetEvent?.title ?? "อีเวนต์"}"`);
    } catch {
      setToast("ไม่สามารถยืนยันการชำระเงินได้");
    }
  };

  return (
    <div className="px-6 py-8">
      {toast && (
        <div className="fixed right-6 top-6 z-[120]">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900">แจ้งเตือน</div>
              <div className="truncate text-xs text-zinc-600">{toast}</div>
            </div>
            <button onClick={() => setToast(null)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="ปิดแจ้งเตือน">
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <CreateEventModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreate} companyOptions={companyOptions} />

      {/* ✅ เพิ่ม eventId prop */}
      <ManageEquipmentModal
        open={isManageOpen}
        eventId={manageEventId ?? ""}
        eventTitle={activeEvent?.title ?? ""}
        startDateInitial={activeEvent ? parseDateRange(activeEvent.date).startStr : ""}
        endDateInitial={activeEvent ? parseDateRange(activeEvent.date).endStr : ""}
        initialEquipment={manageEventId ? equipmentByEvent[manageEventId] ?? [] : []}
        stockData={stockData}
        onClose={() => { setIsManageOpen(false); setManageEventId(null); }}
        onSubmitDecision={async ({ startDate, endDate, equipment, decision }) => {
          if (!manageEventId) return;
          const targetEvent = events.find((ev) => ev.id === manageEventId);
          const oldEquipment = equipmentByEvent[manageEventId];
          try {
            const res = await fetch(`/api/events/${manageEventId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ startDate, endDate, equipment, decision }),
            });
            if (!res.ok) throw new Error("failed");
            // อัปเดต UI เฉพาะหลัง API สำเร็จ
            if (oldEquipment && targetEvent?.status.tone === "success") {
              onReturnStock(oldEquipment.map((eq) => ({ name: eq.name, qty: eq.qty })));
            }
            setEquipmentByEvent((prev) => ({ ...prev, [manageEventId]: equipment }));
            setEvents((prev) => prev.map((ev) => {
              if (ev.id !== manageEventId) return ev;
              return {
                ...ev,
                date: `${startDate} - ${endDate}`,
                items: `${equipment.length} รายการ`,
                status: decision === "approved"
                  ? { text: "อนุมัติแล้ว", tone: "success" as const }
                  : { text: "ไม่อนุมัติ", tone: "rejected" as const },
              };
            }));
            if (decision === "approved") {
              onDeductStock(equipment.map((eq) => ({ name: eq.name, qty: eq.qty })));
              pushNotification({ title: "อนุมัติอุปกรณ์อีเวนต์", message: `${targetEvent?.title ?? "อีเวนต์"} อนุมัติรายการอุปกรณ์แล้ว`, audience: ["SA", "Stockkeeper"] });
              window.dispatchEvent(new CustomEvent("app:event:approved"));
              setToast(`บันทึกแล้ว: "${targetEvent?.title ?? "อีเวนต์"}" ถูกอนุมัติ`);
            } else {
              pushNotification({ title: "ไม่อนุมัติอีเวนต์", message: `${targetEvent?.title ?? "อีเวนต์"} ถูกบันทึกเป็นไม่อนุมัติ`, audience: ["SA"] });
              setToast(`บันทึกแล้ว: "${targetEvent?.title ?? "อีเวนต์"}" ไม่อนุมัติ`);
            }
          } catch {
            setToast("ไม่สามารถบันทึกอีเวนต์ลงฐานข้อมูลได้");
          }
        }}
      />

      <CalendarDayEventsModal
        open={!!calendarDetail}
        dateLabel={calendarDetail ? toDateLocal(calendarDetail.dateKey).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : ""}
        events={calendarDetail?.events ?? []}
        onClose={() => setCalendarDetail(null)}
      />

      <EventDetailModal
        open={!!detailEventId}
        event={detailEvent}
        equipment={detailEquipment}
        role={role}
        onClose={() => setDetailEventId(null)}
        onUploadReceipt={handleUploadReceipt}
        onConfirmPayment={handleConfirmPayment}
      />

      <ConfirmDeleteEventModal open={!!deleteEventId} eventTitle={deleteEvent?.title ?? ""} onConfirm={handleConfirmDeleteEvent} onCancel={() => setDeleteEventId(null)} />

      <EventsHeader role={role} onCreate={() => setIsCreateOpen(true)} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <EventStatCard key={s.label} icon={s.icon} value={s.value} label={s.label} tone={s.tone} />
        ))}
      </div>

      <EventsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        statusOptions={roleStatusOptions}
        isStatusOpen={isStatusOpen}
        setIsStatusOpen={setIsStatusOpen}
        onSelectStatus={(value) => { setStatusFilter(value); setIsStatusOpen(false); }}
        statusRef={statusRef}
      />

      <div className="mt-5 text-sm text-zinc-500">
        แสดง {visibleEvents.length} จาก {roleEvents.length} อีเวนต์
      </div>

      <EventsViewToggle view={view} onChangeView={setView} />

      {view === "list" && (
        <EventsList
          events={visibleEventsWithIssued}
          role={role}
          isLoading={isLoadingEvents}
          onOpenDetail={setDetailEventId}
          onManageItems={onManageItems}
          onDeleteEvent={onDeleteEvent}
        />
      )}

      {view === "calendar" && (
        <EventsCalendar
          monthCursor={monthCursor}
          onPrevMonth={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNextMonth={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          calendarGrid={calendarGrid}
          todayKey={todayKey}
          eventsByDay={eventsByDay}
          onOpenDayEvents={setCalendarDetail}
        />
      )}

      <div className="h-10" />
    </div>
  );
}
