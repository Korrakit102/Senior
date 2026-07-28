import React from "react";
import type { FinanceSummary } from "../types";
import ReportsCard from "./ReportsCard";
import ReportsStatMini from "./ReportsStatMini";
import ReportsExportButton from "./ReportsExportButton";

type Props = {
  finance: FinanceSummary;
  onExport: () => void;
};

export default function FinanceReportSection({
  finance,
  onExport,
}: Props) {
  return (
    <ReportsCard
      title="รายงานการเงิน"
      right={<ReportsExportButton onClick={onExport} />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ReportsStatMini
          title="รายได้รวม"
          value={finance.totalRevenue}
          unit="฿"
          tone="emerald"
        />
        <ReportsStatMini
          title="อีเวนต์ทั้งหมด"
          value={finance.totalEvents}
          tone="sky"
        />
        <ReportsStatMini
          title="ค่าเฉลี่ย/อีเวนต์"
          value={finance.avgPerEvent}
          unit="฿"
          tone="violet"
        />
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-zinc-900">
          5 อันดับอีเวนต์รายได้สูงสุด
        </div>
        <div className="mt-1 text-sm text-zinc-500">
          แสดง {finance.topEvents.length} จาก {finance.totalEvents} อีเวนต์
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white">
          {finance.topEvents.length === 0 ? (
            <div className="p-5 text-sm text-zinc-500">
              ยังไม่มีข้อมูล (0 ฿)
            </div>
          ) : (
            finance.topEvents.map((e, idx) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 p-5 last:border-0"
              >
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {idx + 1}. {e.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{e.id}</div>
                </div>

                <div className="text-sm font-bold text-zinc-900">
                  {e.amount.toLocaleString()} ฿
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ReportsCard>
  );
}
