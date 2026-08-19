import React from "react";
import type { DocCategory } from "../types";
import { categoryLabel } from "../constants";

type Props = {
  cat: DocCategory;
};

export default function ReportsCategoryPill({ cat }: Props) {
  const cls =
    cat === "invoice"
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : cat === "quotation"
        ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
        : cat === "workorder"
          ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
          : cat === "receipt"
            ? "bg-teal-100 text-teal-800 ring-1 ring-teal-200"
            : cat === "report"
              ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200"
              : cat === "contract"
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
                : "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {categoryLabel[cat]}
    </span>
  );
}
