import { Search } from "lucide-react";
import React from "react";

type EventsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  statusOptions: readonly string[];
  isStatusOpen: boolean;
  setIsStatusOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectStatus: (value: string) => void;
  statusRef: React.RefObject<HTMLDivElement | null>;
};

export default function EventsToolbar({
  search,
  onSearchChange,
  statusFilter,
  statusOptions,
  isStatusOpen,
  setIsStatusOpen,
  onSelectStatus,
  statusRef,
}: EventsToolbarProps) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-600"
            placeholder="ค้นหาอีเวนต์ด้วยชื่อ บริษัท ผู้จัด หรือสถานที่..."
          />
        </div>

        <div ref={statusRef} className="relative md:w-[240px]">
          <button
            onClick={() => setIsStatusOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            <span
              className={
                statusFilter === "สถานะทั้งหมด"
                  ? "text-zinc-700"
                  : "text-zinc-800"
              }
            >
              {statusFilter}
            </span>
            <span className="text-zinc-400">▾</span>
          </button>

          {isStatusOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSelectStatus(opt)}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                    opt === statusFilter
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  <span>{opt}</span>
                  {opt === statusFilter ? (
                    <span className="text-zinc-500">✓</span>
                  ) : (
                    <span />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
