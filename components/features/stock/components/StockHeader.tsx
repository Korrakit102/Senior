import React from "react";
import { Package, Download, Plus, PackagePlus } from "lucide-react";

type Props = {
  onExport: () => void;
  onAdd: () => void;
  onReceiveStock: () => void;
};

export default function StockHeader({ onExport, onAdd, onReceiveStock }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Package className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            จัดการสต็อก
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            ระบบจัดการและค้นหาอุปกรณ์
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
        >
          <Download className="h-4 w-4" />
          ส่งออก Excel
        </button>

        <button
          onClick={onReceiveStock}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
        >
          <PackagePlus className="h-4 w-4" />
          รับเข้าสต็อก
        </button>

        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          เพิ่มใหม่
        </button>
      </div>
    </div>
  );
}
