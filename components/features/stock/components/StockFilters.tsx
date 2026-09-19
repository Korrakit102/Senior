import React from "react";
import { Search, ChevronDown, Wallet } from "lucide-react";
import type { Category, ItemStatus } from "../types";
import { fmt } from "../helpers";

type Props = {
  q: string;
  status: "ทั้งหมด" | ItemStatus;
  category: "ทั้งหมด" | Category;
  onQChange: (value: string) => void;
  onStatusChange: (value: "ทั้งหมด" | ItemStatus) => void;
  onCategoryChange: (value: "ทั้งหมด" | Category) => void;
  showing: number;
  total: number;
  totalValue: number;
};

export default function StockFilters({
  q,
  status,
  category,
  onQChange,
  onStatusChange,
  onCategoryChange,
  showing,
  total,
  totalValue,
}: Props) {
  return (
    <>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="ค้นหาอุปกรณ์ด้วย ชื่อ, รหัส..."
            />
          </div>

          <div className="relative md:w-[220px]">
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as "ทั้งหมด" | ItemStatus)
              }
              className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="พร้อมใช้">พร้อมใช้</option>
              <option value="ใช้งานอยู่">ใช้งานอยู่</option>
              <option value="ซ่อมแซม">ซ่อมแซม</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>

          <div className="relative md:w-[220px]">
            <select
              value={category}
              onChange={(e) =>
                onCategoryChange(e.target.value as "ทั้งหมด" | Category)
              }
              className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50"
            >
              <option value="ทั้งหมด">ประเภททั้งหมด</option>
              <option value="ไฟฟ้า">ไฟฟ้า</option>
              <option value="ผ้าใบ">ผ้าใบ</option>
              <option value="ตกแต่ง">ตกแต่ง</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-500">
          แสดง {showing} จาก {total} รายการ
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">มูลค่าสต็อกรวม</div>
            <div className="text-base font-semibold text-zinc-900">฿{fmt(totalValue)}</div>
          </div>
        </div>
      </div>
    </>
  );
}