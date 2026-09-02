import type { ReactNode } from "react";
import type { Role } from "../../AppShell";

export type { Role };

export type ItemStatus = "พร้อมใช้" | "ใช้งานอยู่" | "ซ่อมแซม";
export type Category = "ไฟฟ้า" | "ผ้าใบ" | "ตกแต่ง";

export type StockRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: Category;
  system: string;
  zone: string;
  status: ItemStatus;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
  repairing: number;
};

export type StockTone = "blue" | "green" | "amber" | "zinc";
export type StockStatTone = "neutral" | "emerald" | "violet" | "red";

export type AddForm = {
  id: string;
  status: ItemStatus;
  name: string;
  brand: string;
  category: Category;
  typeLabel: string;
  zone: string;
  qty: string;
  pricePerDay: string;
  cost: string;
};

export type EditForm = {
  status: ItemStatus;
  name: string;
  brand: string;
  category: Category;
  typeLabel: string;
  zone: string;
  qty: string;
  available: string;
  pricePerDay: string;
  cost: string;
};

export type StockStatItem = {
  icon: ReactNode;
  value: number;
  label: string;
  tone: StockStatTone;
};