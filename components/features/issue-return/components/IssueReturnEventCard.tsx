import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  CornerDownLeft,
  Clock,
} from "lucide-react";
import type { IssueEvent, TabKey } from "../types";
import type { Role } from "../../../AppShell";
import IssueReturnStatusPill from "./IssueReturnStatusPill";

type Props = {
  event: IssueEvent;
  tab: TabKey;
  role: Role;
  onIssueClick: (event: IssueEvent) => void;
  onReturnClick: (event: IssueEvent) => void;
};

export default function IssueReturnEventCard({
  event,
  tab,
  role,
  onIssueClick,
  onReturnClick,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate text-base font-semibold text-zinc-900">
              {event.title}
            </h2>
            <IssueReturnStatusPill text="อนุมัติแล้ว" tone="success" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="text-zinc-400">{event.code}</span>
            <span className="text-zinc-300">•</span>
            <span>{event.company}</span>
          </div>
        </div>

        {/* แท็บเบิกอุปกรณ์ */}
        {tab === "issue" && role === "Stockkeeper" && (
          <button
            onClick={() => onIssueClick(event)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <ArrowRight className="h-4 w-4" />
            เบิกอุปกรณ์
          </button>
        )}
        {tab === "issue" && role !== "Stockkeeper" && (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
            <Clock className="h-4 w-4" />
            รอเจ้าหน้าที่คลังดำเนินการ
          </div>
        )}

        {/* แท็บกำลังใช้งาน */}
        {tab === "inuse" && (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            กำลังใช้งาน
          </div>
        )}

        {/* แท็บคืนอุปกรณ์ */}
        {tab === "return" && role === "Stockkeeper" && (
          <button
            onClick={() => onReturnClick(event)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <CornerDownLeft className="h-4 w-4" />
            คืนอุปกรณ์
          </button>
        )}
        {tab === "return" && role !== "Stockkeeper" && (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
            <CornerDownLeft className="h-4 w-4" />
            รอเจ้าหน้าที่คลังคืนอุปกรณ์
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <div className="text-xs text-zinc-400">วันที่จัดงาน</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">
            {event.eventDate}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-400">วันที่เบิก</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">
            {event.issueDate}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-400">อุปกรณ์</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">
            {event.equipment}
          </div>
        </div>
      </div>
    </div>
  );
}
