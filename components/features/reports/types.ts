import type { StockRow as AppStockRow } from "../../AppShell";

export type AppStock = AppStockRow;

export type ReportTab = "finance" | "stock" | "events" | "damage" | "docs";

export type DocCategory =
  | "invoice"
  | "quotation"
  | "workorder"
  | "receipt"
  | "report"
  | "contract"
  | "other";

export type EventEquipmentItem = {
  name: string;
  qty: number;
  category: string;
  pricePerDayTHB: number;
};

export type EventReportRow = {
  id: string;
  title: string;
  company: string;
  date: string;
  startDate: string;
  endDate: string;
  place: string;
  revenue: number;
  equipmentCount: number;
  isDamaged?: boolean;
  organizer?: string;
  contactName?: string;
  contactPhone?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;
  description?: string;
  equipment: EventEquipmentItem[];
  paymentReceipt?: PaymentReceipt;
  status: {
    text: string;
    tone: "success" | "pending";
  };
};

export type PaymentReceipt = {
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
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
  fileName?: string;
  fileUrl?: string;
  source?: "manual" | "event";
};

export type DamageRow = {
  id: string;
  itemName: string;
  code: string;
  eventId?: string;
  date: string;
  qty?: number;
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
