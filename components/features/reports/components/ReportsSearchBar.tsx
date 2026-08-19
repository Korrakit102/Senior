import React from "react";
import { Search } from "lucide-react";
import type { DocCategory, ReportTab } from "../types";

type Props = {
  tab: ReportTab;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  docCategory: "all" | DocCategory;
  onDocCategoryChange: (value: "all" | DocCategory) => void;
  docSort: "newest" | "oldest";
  onDocSortChange: (value: "newest" | "oldest") => void;
};

export default function ReportsSearchBar({
  tab,
  query,
  onQueryChange,
  searchPlaceholder,
  docCategory,
  onDocCategoryChange,
  docSort,
  onDocSortChange,
}: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            placeholder={searchPlaceholder}
          />
        </div>

        {tab === "docs" && (
          <div className="flex items-center gap-3">
            <select
              value={docCategory}
              onChange={(e) =>
                onDocCategoryChange(e.target.value as "all" | DocCategory)
              }
              className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              <option value="invoice">ใบแจ้งหนี้</option>
              <option value="quotation">ใบเสนอราคา</option>
              <option value="workorder">ใบสั่งงาน</option>
              <option value="receipt">ใบเสร็จ</option>
              <option value="report">รายงาน</option>
              <option value="contract">สัญญา</option>
              <option value="other">อื่นๆ</option>
            </select>

            <select
              value={docSort}
              onChange={(e) =>
                onDocSortChange(e.target.value as "newest" | "oldest")
              }
              className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              <option value="newest">วันที่อัปโหลด</option>
              <option value="oldest">เก่ากว่า → ใหม่กว่า</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
