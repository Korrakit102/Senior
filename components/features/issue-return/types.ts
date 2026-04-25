import type { StockRow as AppStockRow } from "../../AppShell";

export type AppStock = AppStockRow;

export type TabKey = "issue" | "inuse" | "return";

export type EventStatus = "ready" | "inuse" | "returned";

export type IssueEvent = {
  id: string;
  title: string;
  code: string;
  company: string;
  eventDate: string;
  issueDate: string;
  equipment: string;
  status: EventStatus;
};

export type EquipmentItem = {
  id: string;
  name: string;
  qty: number;
};

export type EventEquipmentItem = {
  name: string;
  qty: number;
};

export type EquipmentOption = {
  id: string;
  name: string;
  available: number;
};

export type IssueReturnStats = {
  pending: number;
  readyToIssue: number;
  inUse: number;
  readyToReturn: number;
};

export type ReturnItemResult = {
  name: string;
  qty: number;
  damaged: boolean;
  damagedQty: number;
  photos: File[];
};