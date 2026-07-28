import React from "react";
import type { StockReportRow } from "../types";
import ReportsCard from "./ReportsCard";
import ReportsChip from "./ReportsChip";
import ReportsExportButton from "./ReportsExportButton";

type Props = {
  rows: StockReportRow[];
  totalRows: number;
  onExport: () => void;
};

export default function StockReportSection({
  rows,
  totalRows,
  onExport,
}: Props) {
  return (
    <>
      <div className="mb-4 text-sm text-zinc-500">
        แสดง {rows.length} จาก {totalRows} รายการ
      </div>

      <ReportsCard
        title="รายงานสต็อก"
        right={<ReportsExportButton onClick={onExport} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-semibold text-zinc-500">
                <th className="border-b border-zinc-200 py-3 pr-4">ชื่ออุปกรณ์</th>
                <th className="border-b border-zinc-200 py-3 pr-4">ประเภท</th>
                <th className="border-b border-zinc-200 py-3 pr-4">โกดัง</th>
                <th className="border-b border-zinc-200 py-3 pr-4">จำนวน</th>
                <th className="border-b border-zinc-200 py-3 pr-4">ราคา/วัน</th>
                <th className="border-b border-zinc-200 py-3 text-right">
                  ราคาต้นทุน
                </th>
              </tr>
            </thead>

            <tbody className="text-sm text-zinc-900">
              {rows.map((r, idx) => (
                <tr key={`${r.code}-${idx}`} className="hover:bg-zinc-50/60">
                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <div className="font-semibold">{r.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">{r.code}</div>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <ReportsChip>{r.type}</ReportsChip>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <ReportsChip tone="blue">{r.warehouse}</ReportsChip>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <div className="font-semibold">{r.qty}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      ({r.ready} พร้อมใช้)
                    </div>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    {r.pricePerDay.toLocaleString()} ฿
                  </td>

                  <td className="border-b border-zinc-100 py-4 text-right align-top">
                    {r.cost.toLocaleString()} ฿
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportsCard>
    </>
  );
}
