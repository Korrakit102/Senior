import type { StockRow as AppStockRow } from "../../AppShell";

export type AppStock = AppStockRow;

export type ReportTab = "finance" | "stock" | "events" | "damage" | "docs";

export type DocCategory =
  | "invoice"
  | "quotation"
  | "workorder"
  | "report"
  | "contract"
  | "other";

export type EventReportRow = {
  id: string;
  title: string;
  company: string;
  date: string;
  revenue: number;
  equipmentCount: number;
  isDamaged?: boolean;
  status: {
    text: string;
    tone: "success" | "pending";
  };
};

export type DocRow = {
  id: string;
  title: string;
  owner: string;
  category: DocCategory;
  eventOrCompany: string;
  description: string;
  uploadedAt: string;
  uploadedAtISO: string;
  sizeLabel: string;
};

export type DamageRow = {
  id: string;
  itemName: string;
  code: string;
  eventId?: string;
  date: string;
  cost: number;
  status: "reported" | "fixed";
};

export type FinanceTopEvent = {
  id: string;
  name: string;
  amount: number;
};

export type FinanceSummary = {
  totalRevenue: number;
  totalEvents: number;
  avgPerEvent: number;
  topEvents: FinanceTopEvent[];
};

export type StockReportRow = {
  name: string;
  code: string;
  type: string;
  warehouse: string;
  qty: number;
  ready: number;
  pricePerDay: number;
  cost: number;
};