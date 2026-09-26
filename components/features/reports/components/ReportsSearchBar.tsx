import React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import type { DocCategory, EventStatusFilter, ReportTab } from "../types";

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

type Props = {
  tab: ReportTab;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  eventStatusFilter: EventStatusFilter;
  onEventStatusFilterChange: (value: EventStatusFilter) => void;
  docCategory: "all" | DocCategory;
  onDocCategoryChange: (value: "all" | DocCategory) => void;
  docSort: "newest" | "oldest";
  onDocSortChange: (value: "newest" | "oldest") => void;
};

const eventStatusOptions: FilterOption<EventStatusFilter>[] = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "pending", label: "รออนุมัติ" },
  { value: "approved", label: "อนุมัติแล้ว" },
];

const docCategoryOptions: FilterOption<"all" | DocCategory>[] = [
  { value: "all", label: "หมวดหมู่ทั้งหมด" },
  { value: "invoice", label: "ใบแจ้งหนี้" },
  { value: "quotation", label: "ใบเสนอราคา" },
  { value: "workorder", label: "ใบสั่งงาน" },
  { value: "receipt", label: "ใบเสร็จ" },
  { value: "report", label: "รายงาน" },
  { value: "contract", label: "สัญญา" },
  { value: "other", label: "อื่นๆ" },
];

const docSortOptions: FilterOption<"newest" | "oldest">[] = [
  { value: "newest", label: "วันที่อัปโหลด" },
  { value: "oldest", label: "เก่ากว่า → ใหม่กว่า" },
];

export default function ReportsSearchBar({
  tab,
  query,
  onQueryChange,
  searchPlaceholder,
  eventStatusFilter,
  onEventStatusFilterChange,
  docCategory,
  onDocCategoryChange,
  docSort,
  onDocSortChange,
}: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            placeholder={searchPlaceholder}
          />
        </div>

        {tab === "events" && (
          <ReportsFilterDropdown
            value={eventStatusFilter}
            options={eventStatusOptions}
            onChange={onEventStatusFilterChange}
            className="md:w-56"
          />
        )}

        {tab === "docs" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ReportsFilterDropdown
              value={docCategory}
              options={docCategoryOptions}
              onChange={onDocCategoryChange}
              className="sm:w-52"
            />

            <ReportsFilterDropdown
              value={docSort}
              options={docSortOptions}
              onChange={onDocSortChange}
              className="sm:w-56"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsFilterDropdown<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  React.useEffect(() => {
    if (!open) return;

    const closeIfOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-left text-sm font-semibold text-zinc-700 shadow-sm transition",
          open
            ? "border-zinc-300 ring-2 ring-zinc-100"
            : "border-zinc-200 hover:bg-zinc-50",
        ].join(" ")}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-xl">
          <div role="listbox" className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active
                      ? "bg-zinc-100 font-semibold text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-zinc-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
