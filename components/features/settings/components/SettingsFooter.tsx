"use client";

import React from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsFooter({
  onReset,
  saveStatus = "idle",
}: {
  onReset: () => void;
  saveStatus?: SaveStatus;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-xs">
        {saveStatus === "idle" && (
          <span className="text-zinc-400">บันทึกอัตโนมัติลง database</span>
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

      <button
        onClick={onReset}
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Default
      </button>
    </div>
  );
}