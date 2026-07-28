export type Role = "SA" | "Manager" | "Stockkeeper";

export type StatusTone = "success" | "pending" | "progress" | "rejected";

export type EventItem = {
  id: string;
  title: string;
  status: { text: string; tone: StatusTone };
  code: string;
  createdAt: string;
  desc: string;
  company: string;
  place: string;
  date: string;
  items: string;

  organizer?: string;
  contactName?: string;
  contactPhone?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;

  // ✅ เพิ่ม: ติดตามว่า stockkeeper Issue ไปแล้วหรือยัง
  // ถ้า true = ล็อคปุ่มแก้ไขอุปกรณ์
  isIssued?: boolean;

  paymentReceipt?: PaymentReceipt;
};

export type SelectedEquipment = {
  name: string;
  qty: number;
  available: number;
  category: string;
  pricePerDayTHB: number;
};

export type PaymentReceipt = {
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timeISO: string;
  createdAt?: string;
  audience: Role[];
  unreadFor: Role[];
};

export type EventApiItem = EventItem & {
  equipment?: SelectedEquipment[];
  issueStatus?: string;
  paymentReceipt?: PaymentReceipt;
};

export type CreateForm = {
  eventName: string;
  companyName: string;
  organizerName: string;
  contactName: string;
  contactPhone: string;
  branchCode: string;
  budgetTHB: string;
  description: string;
  attendees: string;
  venue: string;
  startDate: string;
  endDate: string;
};
