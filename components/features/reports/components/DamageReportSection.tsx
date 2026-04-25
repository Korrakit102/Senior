import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { DamageRow } from "../types";
import ReportsCard from "./ReportsCard";
import ReportsExportButton from "./ReportsExportButton";
import { fmtDateRangeThai } from "../../events/helpers";

type Props = {
  rows: DamageRow[];
  onExport: () => void;
};

export default function DamageReportSection({ rows, onExport }: Props) {
  return (
    <ReportsCard
      title="รายงานความเสียหาย"
      right={<ReportsExportButton onClick={onExport} />}
    >
      {rows.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="mt-4 text-sm font-semibold text-zinc-900">
              ไม่พบรายงานความเสียหาย
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              อุปกรณ์ทั้งหมดอยู่ในสภาพดี
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-3 text-left text-xs font-semibold text-zinc-500">อุปกรณ์</th>
                <th className="pb-3 text-left text-xs font-semibold text-zinc-500">รหัส Event</th>
                <th className="pb-3 text-left text-xs font-semibold text-zinc-500">วันที่</th>
                <th className="pb-3 text-right text-xs font-semibold text-zinc-500">จำนวนเสียหาย</th>
                <th className="pb-3 text-right text-xs font-semibold text-zinc-500">มูลค่า (฿)</th>
                <th className="pb-3 pl-4 text-left text-xs font-semibold text-zinc-500">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/60">
                  <td className="py-3 font-medium text-zinc-900">{row.itemName}</td>
                  <td className="py-3 text-zinc-500">{row.code}</td>
                  <td className="py-3 text-zinc-500">{fmtDateRangeThai(row.date)}</td>
                  <td className="py-3 text-right font-medium text-zinc-900">
                    {row.qty != null ? `${row.qty} ชิ้น` : "-"}
                  </td>
                  <td className="py-3 text-right font-medium text-zinc-900">
                    {row.cost.toLocaleString("th-TH")}
                  </td>
                  <td className="py-3 pl-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "reported"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      }`}
                    >
                      {row.status === "reported" ? "แจ้งซ่อมแล้ว" : "ซ่อมแล้ว"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportsCard>
  );
}