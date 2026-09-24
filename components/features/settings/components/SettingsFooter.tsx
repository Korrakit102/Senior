"use client";

import React from "react";
import { CheckCircle2, Loader2, RotateCcw, Save, XCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsFooter({
  hasChanges,
  onConfirm,
  onReset,
  saveStatus = "idle",
}: {
  hasChanges: boolean;
  onConfirm: () => void;
  onReset: () => void;
  saveStatus?: SaveStatus;
}) {
  const isSaving = saveStatus === "saving";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-xs">
        {saveStatus === "idle" && hasChanges && (
          <span className="text-amber-600">มีการแก้ไขที่ยังไม่ได้ยืนยัน</span>
        )}
        {saveStatus === "idle" && !hasChanges && (
          <span className="text-zinc-400">ยังไม่มีการแก้ไข</span>
        )}
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
            <span className="text-zinc-400">กำลังบันทึก...</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-600">บันทึกแล้ว</span>
          </>
        )}
        {saveStatus === "error" && (
          <>
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-red-600">บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง</span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={onReset}
          type="button"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          รีเซ็ตเป็นค่าเริ่มต้น
        </button>

        <button
          onClick={onConfirm}
          type="button"
          disabled={!hasChanges || isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ยืนยันการแก้ไข
        </button>
      </div>
    </div>
  );
}
