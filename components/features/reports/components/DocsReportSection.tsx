import React from "react";
import { FilePlus, FileText, Eye, Download, Trash2 } from "lucide-react";
import type { DocRow } from "../types";
import type { Role } from "../../../AppShell";
import ReportsCard from "./ReportsCard";
import ReportsCategoryPill from "./ReportsCategoryPill";
import ReportsExportButton from "./ReportsExportButton";

type Props = {
  role: Role;
  rows: DocRow[];
  totalRows: number;
  onExport: () => void;
  onAddDoc: () => void;
  onViewDoc: (id: string) => void;
  onDownloadDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
};

export default function DocsReportSection({
  role,
  rows,
  totalRows,
  onExport,
  onAddDoc,
  onViewDoc,
  onDownloadDoc,
  onDeleteDoc,
}: Props) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-500">
          แสดง {rows.length} จาก {totalRows} เอกสาร
        </div>

        {role !== "Stockkeeper" && (
          <button
            onClick={onAddDoc}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <FilePlus className="h-4 w-4" />
            เพิ่มเอกสาร
          </button>
        )}
      </div>

      <ReportsCard
        title="เอกสาร"
        right={<ReportsExportButton onClick={onExport} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-semibold text-zinc-500">
                <th className="border-b border-zinc-200 py-3 pr-4">เอกสาร</th>
                <th className="border-b border-zinc-200 py-3 pr-4">หมวดหมู่</th>
                <th className="border-b border-zinc-200 py-3 pr-4">อีเวนต์ / บริษัท</th>
                <th className="border-b border-zinc-200 py-3 pr-4">คำอธิบาย</th>
                <th className="w-36 border-b border-zinc-200 py-3 pr-4">วันที่อัปโหลด</th>
                <th className="border-b border-zinc-200 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="text-sm text-zinc-900">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50/60">
                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{d.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">{d.owner}</div>
                      </div>
                    </div>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <ReportsCategoryPill cat={d.category} />
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <div className="whitespace-pre-line text-sm text-zinc-800">
                      {d.eventOrCompany}
                    </div>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <div className="text-sm text-zinc-700">{d.description}</div>
                  </td>

                  <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                    <div className="whitespace-nowrap text-sm text-zinc-800">
                      {d.uploadedAt}
                    </div>
                  </td>

                  <td className="border-b border-zinc-100 py-4 text-right align-top">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onViewDoc(d.id)}
                        className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                        title="ดู"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDownloadDoc(d.id)}
                        className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                        title="ดาวน์โหลด"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      {role !== "Stockkeeper" && (
                        <button
                          onClick={() => onDeleteDoc(d.id)}
                          className="grid h-9 w-9 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                    ไม่พบเอกสารที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportsCard>
    </>
  );
}
