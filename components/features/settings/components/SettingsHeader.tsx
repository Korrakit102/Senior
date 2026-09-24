"use client";

import React from "react";
import { Plus } from "lucide-react";

export default function SettingsHeader({
  onAddCompanyInfo,
}: {
  onAddCompanyInfo: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          ตั้งค่า
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          ตั้งค่าข้อมูลบริษัทสำหรับใบแจ้งหนี้ ใบเสนอราคา และใบสั่งงาน
        </p>
      </div>

      <div className="flex flex-col gap-2 self-start sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onAddCompanyInfo}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          เพิ่มข้อมูลบริษัท
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
          สำหรับผู้จัดการเท่านั้น
        </div>
      </div>
    </div>
  );
}
