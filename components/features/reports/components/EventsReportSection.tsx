import React from "react";
import type { EventReportRow } from "../types";
import ReportsCard from "./ReportsCard";
import ReportsStatusPill from "./ReportsStatusPill";
import ReportsActionDocButton from "./ReportsActionDocButton";
import ReportsExportButton from "./ReportsExportButton";

type Props = {
  rows: EventReportRow[];
  totalRows: number;
  onExport: () => void;
  onOpenInvoice: (id: string) => void;
  onOpenQuotation: (id: string) => void;
  onOpenWorkOrder: (id: string) => void;
};

export default function EventsReportSection({
  rows,
  totalRows,
  onExport,
  onOpenInvoice,
  onOpenQuotation,
  onOpenWorkOrder,
}: Props) {
  return (
    <>
      <div className="mb-4 text-sm text-zinc-500">
        แสดง {rows.length} จาก {totalRows} Events
      </div>

      <ReportsCard
        title="รายงาน Events"
        right={<ReportsExportButton onClick={onExport} />}
      >
        <div className="rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-200">
          {rows.map((e) => (
            <div key={e.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">
                    {e.title}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {e.company}
                  </div>
                </div>

                <ReportsStatusPill tone={e.status.tone} text={e.status.text} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="text-sm text-zinc-700">
                  <div className="text-xs text-zinc-400">รายได้:</div>
                  <div className="mt-1 font-semibold">
                    {e.revenue.toLocaleString()} ฿
                  </div>
                </div>

                <div className="text-sm text-zinc-700 md:text-right">
                  <div className="text-xs text-zinc-400">อุปกรณ์:</div>
                  <div className="mt-1 font-medium">
                    {e.equipmentCount} รายการ
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ReportsActionDocButton
                  label="ใบแจ้งหนี้"
                  onClick={() => onOpenInvoice(e.id)}
                  disabled={e.status.tone !== "success"}
                />
                <ReportsActionDocButton
                  label="ใบเสนอราคา"
                  onClick={() => onOpenQuotation(e.id)}
                  disabled={e.status.tone !== "success"}
                />
                <ReportsActionDocButton
                  label="ใบสั่งงาน"
                  onClick={() => onOpenWorkOrder(e.id)}
                  disabled={e.status.tone !== "success"}
                />
              </div>
            </div>
          ))}
        </div>
      </ReportsCard>
    </>
  );
}
