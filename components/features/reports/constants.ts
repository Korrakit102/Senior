import type { DocCategory } from "./types";

export const categoryLabel: Record<DocCategory, string> = {
  invoice: "ใบแจ้งหนี้",
  quotation: "ใบเสนอราคา",
  workorder: "ใบสั่งงาน",
  receipt: "ใบเสร็จ",
  report: "รายงาน",
  contract: "สัญญา",
  other: "อื่นๆ",
};

export const DOC_CATEGORY_OPTIONS = [
  { value: "all", label: "หมวดหมู่ทั้งหมด" },
  { value: "invoice", label: "ใบแจ้งหนี้" },
  { value: "quotation", label: "ใบเสนอราคา" },
  { value: "workorder", label: "ใบสั่งงาน" },
  { value: "receipt", label: "ใบเสร็จ" },
  { value: "report", label: "รายงาน" },
  { value: "contract", label: "สัญญา" },
  { value: "other", label: "อื่นๆ" },
] as const;

export const DOC_SORT_OPTIONS = [
  { value: "newest", label: "วันที่อัปโหลด" },
  { value: "oldest", label: "เก่ากว่า → ใหม่กว่า" },
] as const;
