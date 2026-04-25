import type {
  AppStock,
  EquipmentItem,
  EquipmentOption,
  EventStatus,
  IssueEvent,
  IssueReturnStats,
  TabKey,
} from "./types";
import { fmtDateShortThai, toDateLocal } from "../events/helpers";

export function mapEquipmentOptions(stockData: AppStock[]): EquipmentOption[] {
  return stockData.map((s) => ({
    id: s.id,
    name: s.name,
    available: s.available,
  }));
}

export function mergeEquipmentItems(
  prev: EquipmentItem[],
  item: EquipmentItem
): EquipmentItem[] {
  const idx = prev.findIndex((i) => i.id === item.id);

  if (idx >= 0) {
    const next = [...prev];
    next[idx].qty += item.qty;
    return next;
  }

  return [...prev, item];
}

export function removeEquipmentItem(
  prev: EquipmentItem[],
  id: string
): EquipmentItem[] {
  return prev.filter((i) => i.id !== id);
}

export function getIssueReturnStats(events: IssueEvent[]): IssueReturnStats {
  return {
    pending: events.length,
    readyToIssue: events.filter((e) => e.status === "ready").length,
    inUse: events.filter((e) => e.status === "inuse").length,
    readyToReturn: events.filter((e) => e.status === "returned").length,
  };
}

export function getIssueList(events: IssueEvent[]) {
  return events.filter((e) => e.status === "ready");
}

export function getInUseList(events: IssueEvent[]) {
  return events.filter((e) => e.status === "inuse");
}

// Return tab แสดง event เดียวกับ inuse tab แต่ให้ Stockkeeper กด "คืนอุปกรณ์" ได้
export function getReturnList(events: IssueEvent[]) {
  return getInUseList(events);
}

export function getVisibleList(
  tab: TabKey,
  issueList: IssueEvent[],
  inUseList: IssueEvent[],
  returnList: IssueEvent[]
) {
  if (tab === "issue") return issueList;
  if (tab === "inuse") return inUseList;
  return returnList;
}

export function getEmptyStateText(tab: TabKey) {
  if (tab === "issue") return "ไม่มี Event ที่รอ Issue";
  if (tab === "inuse") return "ไม่มี Event ที่กำลังใช้งาน";
  return "ไม่มี Event ที่รอคืนอุปกรณ์";
}

export function mapApiEventsToIssueEvents(
  rows: Array<{
    id: string;
    title: string;
    code: string;
    company: string;
    date: string;
    items: string;
    status: { text: string; tone: string };
    issueStatus?: EventStatus;
    equipment?: Array<{ name: string; qty: number }>;
  }>
): IssueEvent[] {
  return rows
    .filter((r) => r.status?.tone === "success")
    .map((r) => {
      const [startStr] = r.date.split(" - ").map((s) => s.trim());
      const formattedDate = fmtDateShortThai(toDateLocal(startStr));

      return {
        id: r.id,
        title: r.title,
        code: r.code,
        company: r.company,
        eventDate: formattedDate,
        issueDate: formattedDate,
        equipment: r.items,
        status:
          r.issueStatus === "inuse" || r.issueStatus === "returned"
            ? r.issueStatus
            : "ready",
      };
    });
}

export function mapEquipmentByEvent(
  rows: Array<{
    id: string;
    equipment?: Array<{ name: string; qty: number }>;
  }>
) {
  const nextEquipmentByEvent: Record<string, { name: string; qty: number }[]> = {};

  for (const row of rows) {
    nextEquipmentByEvent[row.id] = Array.isArray(row.equipment)
      ? row.equipment
          .filter(
            (item) =>
              item &&
              item.name &&
              typeof item.qty === "number" &&
              item.qty > 0
          )
          .map((item) => ({
            name: item.name,
            qty: item.qty,
          }))
      : [];
  }

  return nextEquipmentByEvent;
}