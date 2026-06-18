import React from "react";
import { FilePlus } from "lucide-react";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export default function ReportsActionDocButton({ label, onClick, disabled }: Props) {
  return (
    <div className="relative group inline-flex">
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={
          disabled
            ? "inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-400 cursor-not-allowed select-none"
            : "inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
        }
      >
        <FilePlus className={`h-4 w-4 ${disabled ? "text-zinc-300" : "text-zinc-500"}`} />
        {label}
      </button>
      {disabled && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex whitespace-nowrap rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white shadow-lg z-10">
          ต้องอนุมัติก่อนจึงจะออกเอกสารได้
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
        </div>
      )}
    </div>
  );
}