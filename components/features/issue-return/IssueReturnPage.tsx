"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Role, StockRow } from "../../AppShell";
import type { DamageRow } from "../reports/types";
import type {
  EquipmentItem,
  EventEquipmentItem,
  EventStatus,
  IssueEvent,
  ReturnItemResult,
  TabKey,
} from "./types";
import {
  getEmptyStateText,
  getInUseList,
  getIssueList,
  getIssueReturnStats,
  getReturnList,
  getVisibleList,
  mapApiEventsToIssueEvents,
  mapEquipmentByEvent,
  mapEquipmentOptions,
} from "./helpers";

import IssueReturnHeader from "./components/IssueReturnHeader";
import IssueReturnStats from "./components/IssueReturnStats";
import IssueReturnTabs from "./components/IssueReturnTabs";
import IssueReturnEventList from "./components/IssueReturnEventList";
import IssueReturnToast from "./components/IssueReturnToast";

import QuickIssueModal from "./modals/QuickIssueModal";
import QuickReturnModal from "./modals/QuickReturnModal";
import ConfirmIssueModal from "./modals/ConfirmIssueModal";
import ConfirmReturnModal from "./modals/ConfirmReturnModal";

type UpdatedStockRow = {
  id: string;
  qty: number;
  available: number;
  status: string;
  repairing: number;
};

type Props = {
  role: Role;
  stockData: StockRow[];
  onStockRowsUpdated: (rows: UpdatedStockRow[]) => void;
  onMarkEventAsIssued?: (eventId: string) => void;
  onUnmarkEventAsIssued?: (eventId: string) => void;
  onAddDamageRows?: (rows: DamageRow[]) => void;
};

type QuickEquipmentResponse = {
  equipment?: Array<{ name: string; qty: number }>;
  issueStatus?: EventStatus;
  stock?: UpdatedStockRow[];
};

function normalizeEventEquipmentItems(
  equipment: Array<{ name: string; qty: number }> | undefined
): EventEquipmentItem[] {
  if (!Array.isArray(equipment)) return [];

  return equipment
    .filter((item) => item.name && Number(item.qty) > 0)
    .map((item) => ({
      name: item.name,
      qty: Number(item.qty),
    }));
}

function mergeEventEquipmentItems(
  current: EventEquipmentItem[],
  incoming: EquipmentItem[]
): EventEquipmentItem[] {
  const byName = new Map<string, EventEquipmentItem>();

  for (const item of current) {
    byName.set(item.name, { ...item });
  }

  for (const item of incoming) {
    const existing = byName.get(item.name);
    byName.set(item.name, {
      name: item.name,
      qty: (existing?.qty ?? 0) + item.qty,
    });
  }

  return Array.from(byName.values());
}

function subtractEventEquipmentItems(
  current: EventEquipmentItem[],
  returned: EquipmentItem[]
): EventEquipmentItem[] {
  const byName = new Map<string, EventEquipmentItem>();

  for (const item of current) {
    byName.set(item.name, { ...item });
  }

  for (const item of returned) {
    const existing = byName.get(item.name);
    if (!existing) continue;

    const nextQty = existing.qty - item.qty;
    if (nextQty > 0) {
      byName.set(item.name, { ...existing, qty: nextQty });
    } else {
      byName.delete(item.name);
    }
  }

  return Array.from(byName.values());
}

export default function IssueReturnPage({
  role,
  stockData,
  onStockRowsUpdated,
  onMarkEventAsIssued,
  onUnmarkEventAsIssued,
  onAddDamageRows,
}: Props) {
  const [tab, setTab] = useState<TabKey>("issue");
  const [events, setEvents] = useState<IssueEvent[]>([]);
  const [equipmentByEvent, setEquipmentByEvent] = useState<Record<string, EventEquipmentItem[]>>({});
  const [isQuickIssueOpen, setIsQuickIssueOpen] = useState(false);
  const [isQuickReturnOpen, setIsQuickReturnOpen] = useState(false);
  const [confirmIssueEvent, setConfirmIssueEvent] = useState<IssueEvent | null>(null);
  const [confirmReturnEvent, setConfirmReturnEvent] = useState<IssueEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("failed to load events");
        const rows = (await res.json()) as Array<{
          id: string; title: string; code: string; company: string;
          date: string; items: string; status: { text: string; tone: string };
          issueStatus?: EventStatus; equipment?: Array<{ name: string; qty: number }>;
        }>;
        setEvents(mapApiEventsToIssueEvents(rows));
        setEquipmentByEvent(mapEquipmentByEvent(rows));
      } catch {
        setEvents([]);
        setEquipmentByEvent({});
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const onReload = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) return;
        const rows = (await res.json()) as Array<{
          id: string; title: string; code: string; company: string;
          date: string; items: string; status: { text: string; tone: string };
          issueStatus?: EventStatus; equipment?: Array<{ name: string; qty: number }>;
        }>;
        setEvents(mapApiEventsToIssueEvents(rows));
        setEquipmentByEvent(mapEquipmentByEvent(rows));
      } catch { /* silent */ }
    };
    window.addEventListener("app:event:approved", onReload);
    return () => window.removeEventListener("app:event:approved", onReload);
  }, []);

  const equipmentOptions = useMemo(() => mapEquipmentOptions(stockData), [stockData]);
  const issueList = useMemo(() => getIssueList(events), [events]);
  const inUseList = useMemo(() => getInUseList(events), [events]);
  const returnList = useMemo(() => getReturnList(events), [events]);
  const quickIssueEvents = useMemo(
    () => events.filter((event) => event.status !== "returned"),
    [events]
  );
  const quickReturnEvents = useMemo(
    () => inUseList.filter((event) => (equipmentByEvent[event.id] ?? []).length > 0),
    [inUseList, equipmentByEvent]
  );
  const visibleList = useMemo(
    () => getVisibleList(tab, issueList, inUseList, returnList),
    [tab, issueList, inUseList, returnList]
  );
  const stats = useMemo(() => getIssueReturnStats(events), [events]);
  const emptyText = useMemo(() => getEmptyStateText(tab), [tab]);

  const buildEventEquipmentPayload = (items: EquipmentItem[]) =>
    items.map((item) => {
      const stock = stockData.find((s) => s.id === item.id || s.name === item.name);
      return {
        name: item.name,
        qty: item.qty,
        available: stock?.available ?? 0,
        category: stock?.system ?? "",
        pricePerDayTHB: stock?.pricePerDay ?? 0,
      };
    });

  const pushNotification = (data: { title: string; message: string; audience: Role[] }) => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const notif = await res.json();
        window.dispatchEvent(
          new CustomEvent("app:notification:new", {
            detail: {
              id: notif.id,
              createdAt: notif.createdAt,
              timeISO: notif.createdAt,
              title: data.title,
              message: data.message,
              audience: data.audience,
              unreadFor: data.audience,
            },
          })
        );
      })
      .catch(() => undefined);
  };

  const handleIssueClick = (event: IssueEvent) => setConfirmIssueEvent(event);

  const handleConfirmIssue = async () => {
    if (!confirmIssueEvent) return;
    try {
      const res = await fetch(`/api/events/${confirmIssueEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueStatus: "inuse" }),
      });
      if (!res.ok) throw new Error("failed to update issue status");
      setEvents((prev) => prev.map((e) => e.id === confirmIssueEvent.id ? { ...e, status: "inuse" } : e));
      onMarkEventAsIssued?.(confirmIssueEvent.id);
      setToast(`✅ เบิกอุปกรณ์สำเร็จ: "${confirmIssueEvent.title}"`);
      setConfirmIssueEvent(null);
      setTab("inuse");
    } catch {
      setToast("ไม่สามารถบันทึกสถานะกำลังใช้งานได้");
    }
  };

  const handleReturnClick = (event: IssueEvent) => setConfirmReturnEvent(event);

  const handleConfirmReturn = async (returnItems: ReturnItemResult[]) => {
    if (!confirmReturnEvent) return;
    try {
      const damagedItems = returnItems.filter((i) => i.damaged);
      const normalItems = returnItems.filter((i) => !i.damaged);
      const anyDamaged = damagedItems.length > 0;

      // คืนส่วนที่ไม่เสียหายกลับก่อน (qty - damagedQty) แล้วรวมกับรายการที่ไม่เสียหายล้วน
      const undamagedPortions = damagedItems
        .filter((i) => i.qty > i.damagedQty)
        .map((i) => ({ name: i.name, qty: i.qty - i.damagedQty }));
      const normalStockItems =
        returnItems.length === 0
          ? (equipmentByEvent[confirmReturnEvent.id] ?? []).map((i) => ({ name: i.name, qty: i.qty }))
          : [...undamagedPortions, ...normalItems.map((i) => ({ name: i.name, qty: i.qty }))];
      const damagedStockItems = damagedItems.map((i) => ({ name: i.name, qty: i.damagedQty }));

      const res = await fetch(`/api/events/${confirmReturnEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueStatus: "returned",
          isDamaged: anyDamaged,
          normalItems: normalStockItems,
          damagedItems: damagedStockItems,
        }),
      });
      if (!res.ok) throw new Error("failed to update issue status");
      const data = (await res.json()) as { stock?: UpdatedStockRow[] };
      onStockRowsUpdated(data.stock ?? []);

      // Build per-item DamageRow entries
      if (anyDamaged && onAddDamageRows) {
        const newRows: DamageRow[] = damagedItems.map((item, idx) => {
          const replacementCost = stockData.find((s) => s.name === item.name)?.cost ?? 0;
          return {
            id: `dmg-${confirmReturnEvent.id}-${idx}-${Date.now()}`,
            itemName: item.name,
            code: confirmReturnEvent.code,
            eventId: confirmReturnEvent.id,
            date: confirmReturnEvent.eventDate,
            qty: item.damagedQty,
            cost: replacementCost * item.damagedQty,
            status: "reported",
          };
        });
        onAddDamageRows(newRows);

        // บันทึก breakdown ความเสียหายรายชิ้นลง DB แบบถาวร พร้อมรูปหลักฐานของแต่ละรายการ (ไม่ใช่แค่ state ชั่วคราวในเบราว์เซอร์)
        const damageFormData = new FormData();
        damageFormData.append("eventId", confirmReturnEvent.id);
        damageFormData.append("eventCode", confirmReturnEvent.code);
        damageFormData.append("eventDate", confirmReturnEvent.eventDate);
        damageFormData.append(
          "items",
          JSON.stringify(newRows.map((r) => ({ itemName: r.itemName, qty: r.qty, cost: r.cost })))
        );
        damageFormData.append("photoCounts", JSON.stringify(damagedItems.map((i) => i.photos.length)));
        damagedItems.forEach((item) => {
          item.photos.forEach((file) => damageFormData.append("photos", file));
        });

        fetch("/api/damage-items", { method: "POST", body: damageFormData }).catch(() => undefined);
      }

      setEvents((prev) =>
        prev.map((e) => e.id === confirmReturnEvent.id ? { ...e, status: "returned" } : e)
      );
      window.dispatchEvent(new CustomEvent("app:event:returned"));
      onUnmarkEventAsIssued?.(confirmReturnEvent.id);
      pushNotification({
        title: "รอชำระเงิน",
        message: `${confirmReturnEvent.title} คืนอุปกรณ์ครบแล้ว กรุณาชำระเงินและแนบใบเสร็จ`,
        audience: ["SA"],
      });

      const totalPhotos = returnItems.reduce((sum, i) => sum + i.photos.length, 0);
      if (anyDamaged) {
        setToast(
          `✅ คืนอุปกรณ์แล้ว (เสียหาย ${damagedItems.length} รายการ${totalPhotos > 0 ? ` • แนบรูป ${totalPhotos} รูป` : ""}): "${confirmReturnEvent.title}"`
        );
      } else {
        setToast(`✅ คืนอุปกรณ์สำเร็จ: "${confirmReturnEvent.title}"`);
      }
      setConfirmReturnEvent(null);
    } catch {
      setToast("ไม่สามารถบันทึกสถานะคืนอุปกรณ์ได้");
      setConfirmReturnEvent(null);
    }
  };

  const handleQuickIssue = async (eventId: string, items: EquipmentItem[]) => {
    const selectedEvent = events.find((event) => event.id === eventId);
    const fallbackEquipment = mergeEventEquipmentItems(equipmentByEvent[eventId] ?? [], items);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quickEquipmentAction: "add",
          equipment: buildEventEquipmentPayload(items),
        }),
      });
      // สต็อกไม่พอ (เช่น มีคนเบิกตัดหน้าไปก่อน) — backend ส่งรายการที่ไม่พอมาใน error ให้แสดงตรงๆ
      if (res.status === 409) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setToast(data?.error ?? "สต็อกไม่พอสำหรับการเบิก");
        return;
      }
      if (!res.ok) throw new Error("failed to add event equipment");

      const data = (await res.json()) as QuickEquipmentResponse;
      const nextEquipment =
        data.equipment !== undefined
          ? normalizeEventEquipmentItems(data.equipment)
          : fallbackEquipment;

      onStockRowsUpdated(data.stock ?? []);
      setEquipmentByEvent((prev) => ({ ...prev, [eventId]: nextEquipment }));
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: "inuse",
                equipment: `${nextEquipment.length} รายการ`,
              }
            : event
        )
      );
      onMarkEventAsIssued?.(eventId);
      setTab("inuse");
      setToast(`✅ เบิกอุปกรณ์ด่วนสำเร็จ: "${selectedEvent?.title ?? "อีเวนต์ที่เลือก"}"`);
    } catch {
      setToast("ไม่สามารถเพิ่มอุปกรณ์เข้าอีเวนต์ได้");
    }
  };

  const handleQuickReturn = async (
    eventId: string,
    items: EquipmentItem[],
    damaged: boolean,
    photos: File[]
  ) => {
    const selectedEvent = events.find((event) => event.id === eventId);
    const fallbackEquipment = subtractEventEquipmentItems(equipmentByEvent[eventId] ?? [], items);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quickEquipmentAction: "remove",
          equipment: items.map((item) => ({ name: item.name, qty: item.qty })),
          isDamaged: damaged,
        }),
      });
      if (!res.ok) throw new Error("failed to remove event equipment");

      const data = (await res.json()) as QuickEquipmentResponse;
      const nextEquipment =
        data.equipment !== undefined
          ? normalizeEventEquipmentItems(data.equipment)
          : fallbackEquipment;
      const nextStatus: EventStatus =
        data.issueStatus === "returned" || nextEquipment.length === 0
          ? "returned"
          : "inuse";

      onStockRowsUpdated(data.stock ?? []);

      if (damaged && onAddDamageRows) {
        const newRows: DamageRow[] = items.map((item, idx) => {
          const replacementCost = stockData.find((s) => s.name === item.name)?.cost ?? 0;
          return {
            id: `dmg-${eventId}-${idx}-${Date.now()}`,
            itemName: item.name,
            code: selectedEvent?.code ?? eventId,
            eventId,
            date: selectedEvent?.eventDate ?? "",
            qty: item.qty,
            cost: replacementCost * item.qty,
            status: "reported",
          };
        });
        onAddDamageRows(newRows);

        // บันทึก breakdown ความเสียหายรายชิ้นลง DB แบบถาวร พร้อมรูปหลักฐาน (ไม่ใช่แค่ state ชั่วคราวในเบราว์เซอร์)
        const damageFormData = new FormData();
        damageFormData.append("eventId", eventId);
        damageFormData.append("eventCode", selectedEvent?.code ?? eventId);
        damageFormData.append("eventDate", selectedEvent?.eventDate ?? "");
        damageFormData.append(
          "items",
          JSON.stringify(newRows.map((r) => ({ itemName: r.itemName, qty: r.qty, cost: r.cost })))
        );
        // คืนด่วนมีรูปหลักฐานชุดเดียวรวมทุกอุปกรณ์ (ไม่แยกต่อชิ้นเหมือนหน้าคืนปกติ) จึงผูกไว้กับรายการแรกรายการเดียว
        damageFormData.append(
          "photoCounts",
          JSON.stringify(newRows.map((_, idx) => (idx === 0 ? photos.length : 0)))
        );
        photos.forEach((file) => damageFormData.append("photos", file));

        fetch("/api/damage-items", { method: "POST", body: damageFormData }).catch(() => undefined);
      }

      setEquipmentByEvent((prev) => ({ ...prev, [eventId]: nextEquipment }));
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: nextStatus,
                equipment: `${nextEquipment.length} รายการ`,
              }
            : event
        )
      );

      if (nextStatus === "returned") {
        window.dispatchEvent(new CustomEvent("app:event:returned"));
        onUnmarkEventAsIssued?.(eventId);
        pushNotification({
          title: "รอชำระเงิน",
          message: `${selectedEvent?.title ?? "อีเวนต์"} คืนอุปกรณ์ครบแล้ว กรุณาชำระเงินและแนบใบเสร็จ`,
          audience: ["SA"],
        });
      }

      const names = items.map((i) => i.name).join(", ");
      if (damaged) {
        setToast(
          `✅ คืนอุปกรณ์ด่วนแล้ว (ส่งซ่อม): "${selectedEvent?.title ?? "อีเวนต์ที่เลือก"}" - ${names}${photos.length > 0 ? ` • แนบรูป ${photos.length} รูป` : ""}`
        );
      } else {
        setToast(`✅ คืนอุปกรณ์ด่วนสำเร็จ: "${selectedEvent?.title ?? "อีเวนต์ที่เลือก"}" - ${names}`);
      }
    } catch {
      setToast("ไม่สามารถบันทึกการคืนอุปกรณ์ของอีเวนต์ได้");
    }
  };

  return (
    <>
      {toast && <IssueReturnToast message={toast} onClose={() => setToast(null)} />}

      <QuickIssueModal
        open={isQuickIssueOpen}
        onClose={() => setIsQuickIssueOpen(false)}
        onConfirm={handleQuickIssue}
        equipmentOptions={equipmentOptions}
        eventOptions={quickIssueEvents}
        eventEquipmentById={equipmentByEvent}
      />
      <QuickReturnModal
        open={isQuickReturnOpen}
        onClose={() => setIsQuickReturnOpen(false)}
        onConfirm={handleQuickReturn}
        eventOptions={quickReturnEvents}
        eventEquipmentById={equipmentByEvent}
      />
      <ConfirmIssueModal
        open={!!confirmIssueEvent}
        event={confirmIssueEvent}
        equipmentItems={confirmIssueEvent ? (equipmentByEvent[confirmIssueEvent.id] ?? []) : []}
        onConfirm={handleConfirmIssue}
        onCancel={() => setConfirmIssueEvent(null)}
      />
      <ConfirmReturnModal
        open={!!confirmReturnEvent}
        event={confirmReturnEvent}
        equipmentItems={confirmReturnEvent ? (equipmentByEvent[confirmReturnEvent.id] ?? []) : []}
        onConfirm={handleConfirmReturn}
        onCancel={() => setConfirmReturnEvent(null)}
      />

      <div className="px-6 py-8">
        <IssueReturnHeader onOpenQuickIssue={() => setIsQuickIssueOpen(true)} onOpenQuickReturn={() => setIsQuickReturnOpen(true)} />
        <IssueReturnStats stats={stats} />
        <IssueReturnTabs tab={tab} issueCount={issueList.length} inUseCount={inUseList.length} returnCount={returnList.length} onChange={setTab} />
        <IssueReturnEventList
          role={role}
          tab={tab}
          events={visibleList}
          emptyText={emptyText}
          onIssueClick={handleIssueClick}
          onReturnClick={handleReturnClick}
        />
        <div className="h-10" />
      </div>
    </>
  );
}
