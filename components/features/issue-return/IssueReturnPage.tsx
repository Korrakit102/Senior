"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Role, StockRow } from "../../AppShell";
import type {
  EquipmentItem,
  EventEquipmentItem,
  EventStatus,
  IssueEvent,
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

type Props = {
  role: Role;
  stockData: StockRow[];
  onDeductStock: (equipmentList: { name: string; qty: number }[]) => void;
  onReturnStock: (equipmentList: { name: string; qty: number }[]) => void;
  onMarkDamagedStock: (equipmentList: { name: string; qty: number }[]) => void;
  onMarkEventAsIssued?: (eventId: string) => void;
  onUnmarkEventAsIssued?: (eventId: string) => void;
};

export default function IssueReturnPage({
  role,
  stockData,
  onDeductStock,
  onReturnStock,
  onMarkDamagedStock,
  onMarkEventAsIssued,
  onUnmarkEventAsIssued,
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
  const visibleList = useMemo(() => getVisibleList(tab, issueList, inUseList, returnList), [tab, issueList, inUseList, returnList]);
  const stats = useMemo(() => getIssueReturnStats(events), [events]);
  const emptyText = useMemo(() => getEmptyStateText(tab), [tab]);

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
      // H3: อัปเดต stock UI หลัง API สำเร็จ
      const equipment = equipmentByEvent[confirmIssueEvent.id] ?? [];
      if (equipment.length > 0) {
        onDeductStock(equipment.map((item) => ({ name: item.name, qty: item.qty })));
      }
      setEvents((prev) => prev.map((e) => e.id === confirmIssueEvent.id ? { ...e, status: "inuse" } : e));
      onMarkEventAsIssued?.(confirmIssueEvent.id);
      setToast(`✅ Issue สำเร็จ: "${confirmIssueEvent.title}"`);
      setConfirmIssueEvent(null);
      setTab("inuse");
    } catch {
      setToast("ไม่สามารถบันทึกสถานะ In Use ได้");
    }
  };

  const handleReturnClick = (event: IssueEvent) => setConfirmReturnEvent(event);

  const handleConfirmReturn = async (damaged: boolean, photos: File[]) => {
    if (!confirmReturnEvent) return;
    try {
      // H4+H5: ส่ง isDamaged ไปพร้อมกัน และ API จะ reset status เองในคำสั่งเดียว
      const res = await fetch(`/api/events/${confirmReturnEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueStatus: "returned", isDamaged: damaged }),
      });
      if (!res.ok) throw new Error("failed to update issue status");

      // H5: อัปเดต stock UI หลัง API สำเร็จเท่านั้น
      const equipment = equipmentByEvent[confirmReturnEvent.id] ?? [];
      if (equipment.length > 0) {
        if (damaged) {
          onMarkDamagedStock(equipment.map((item) => ({ name: item.name, qty: item.qty })));
        } else {
          onReturnStock(equipment.map((item) => ({ name: item.name, qty: item.qty })));
        }
      }

      setEvents((prev) => prev.map((e) => e.id === confirmReturnEvent.id ? { ...e, status: "returned" } : e));
      window.dispatchEvent(new CustomEvent("app:event:returned"));
      onUnmarkEventAsIssued?.(confirmReturnEvent.id);

      if (damaged) {
        setToast(`✅ คืนอุปกรณ์แล้ว (ส่งซ่อม): "${confirmReturnEvent.title}"${photos.length > 0 ? ` • แนบรูป ${photos.length} รูป` : ""}`);
      } else {
        setToast(`✅ คืนอุปกรณ์สำเร็จ: "${confirmReturnEvent.title}"`);
      }
      setConfirmReturnEvent(null);
    } catch {
      setToast("ไม่สามารถบันทึกสถานะ Return ได้");
      setConfirmReturnEvent(null);
    }
  };

  const handleQuickIssue = (items: EquipmentItem[]) => {
    onDeductStock(items.map((i) => ({ name: i.name, qty: i.qty })));
    setToast(`✅ Quick Issue สำเร็จ: ${items.map((i) => i.name).join(", ")}`);
  };

  const handleQuickReturn = (items: EquipmentItem[], damaged: boolean, photos: File[]) => {
    if (damaged) {
      onMarkDamagedStock(items.map((i) => ({ name: i.name, qty: i.qty })));
    } else {
      onReturnStock(items.map((i) => ({ name: i.name, qty: i.qty })));
    }
    const names = items.map((i) => i.name).join(", ");
    if (damaged) {
      setToast(`✅ Quick Return แล้ว (ส่งซ่อม): ${names}${photos.length > 0 ? ` • แนบรูป ${photos.length} รูป` : ""}`);
    } else {
      setToast(`✅ Quick Return สำเร็จ: ${names}`);
    }
  };

  return (
    <>
      {toast && <IssueReturnToast message={toast} onClose={() => setToast(null)} />}

      <QuickIssueModal open={isQuickIssueOpen} onClose={() => setIsQuickIssueOpen(false)} onConfirm={handleQuickIssue} equipmentOptions={equipmentOptions} />
      <QuickReturnModal open={isQuickReturnOpen} onClose={() => setIsQuickReturnOpen(false)} onConfirm={handleQuickReturn} equipmentOptions={equipmentOptions} />
      <ConfirmIssueModal open={!!confirmIssueEvent} event={confirmIssueEvent} onConfirm={handleConfirmIssue} onCancel={() => setConfirmIssueEvent(null)} />
      <ConfirmReturnModal open={!!confirmReturnEvent} event={confirmReturnEvent} onConfirm={handleConfirmReturn} onCancel={() => setConfirmReturnEvent(null)} />

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