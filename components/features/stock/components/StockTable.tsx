import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { StockRow } from "../types";
import { fmt, getCategoryTone, getStatusTone } from "../helpers";
import StockPill from "./StockPill";

type Props = {
  rows: StockRow[];
  showEdit: boolean;
  showDelete: boolean;
  onView: (item: StockRow) => void;
  onEdit: (item: StockRow) => void;
  onDelete: (item: StockRow) => void;
};

export default function StockTable({
  rows,
  showEdit,
  showDelete,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead className="bg-white">
            <tr className="border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500">
              <th className="px-6 py-4">รหัสระบบ / รหัสอุปกรณ์</th>
              <th className="px-6 py-4">ชื่ออุปกรณ์</th>
              <th className="px-6 py-4">ยี่ห้อ</th>
              <th className="px-6 py-4">ประเภท</th>
              <th className="px-6 py-4">จัดเก็บ</th>
              <th className="px-6 py-4">สถานะ</th>
              <th className="px-6 py-4 text-center">จำนวน</th>
              <th className="px-6 py-4 text-center">ค่าบริการ/วัน</th>
              <th className="px-6 py-4 text-center">ราคาต้นทุน</th>
              <th className="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-sm text-zinc-800">
            {rows.map((r, idx) => {
              const catTone = getCategoryTone(r.category);
              const statusTone = getStatusTone(r.status);

              return (
                <tr
                  key={`${r.id}-${idx}`}
                  className={idx % 2 ? "bg-zinc-50/30" : "bg-white"}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <StockPill tone="blue">{r.id}</StockPill>
                      <StockPill tone="blue">{r.code}</StockPill>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="font-semibold text-zinc-900">{r.name}</div>
                  </td>

                  <td className="px-6 py-5">{r.brand}</td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <StockPill tone={catTone}>{r.category}</StockPill>
                      <span className="text-zinc-500">{r.system}</span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <StockPill tone="blue">{r.zone}</StockPill>
                  </td>

                  <td className="px-6 py-5">
                    <StockPill tone={statusTone}>{r.status}</StockPill>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="font-semibold">{fmt(r.qty)}</div>
                    <div className="text-xs text-zinc-500">
                      ({fmt(r.available)} พร้อมใช้)
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">{fmt(r.pricePerDay)} ฿</td>
                  <td className="px-6 py-5 text-center">{fmt(r.cost)} ฿</td>

                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(r)}
                        className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                        title="ดู"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {showEdit && (
                        <button
                          onClick={() => onEdit(r)}
                          className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                          title="แก้ไข"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {showDelete && (
                        <button
                          onClick={() => onDelete(r)}
                          className="grid h-9 w-9 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
