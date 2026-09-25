import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Wallet, X } from "lucide-react";
import type { ItemStatus } from "../types";
import { fmt } from "../helpers";

type Props = {
  q: string;
  status: "ทั้งหมด" | ItemStatus;
  categories: string[];
  categoryOptions: string[];
  onQChange: (value: string) => void;
  onStatusChange: (value: "ทั้งหมด" | ItemStatus) => void;
  onCategoryChange: (value: string[]) => void;
  showing: number;
  total: number;
  totalValue: number;
};

export default function StockFilters({
  q,
  status,
  categories,
  categoryOptions,
  onQChange,
  onStatusChange,
  onCategoryChange,
  showing,
  total,
  totalValue,
}: Props) {
  return (
    <>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="ค้นหาอุปกรณ์ด้วย ชื่อ, รหัส..."
            />
          </div>

          <div className="relative md:w-[220px]">
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as "ทั้งหมด" | ItemStatus)
              }
              className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="พร้อมใช้">พร้อมใช้</option>
              <option value="ใช้งานอยู่">ใช้งานอยู่</option>
              <option value="ซ่อมแซม">ซ่อมแซม</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>

          <CategoryMultiDropdown
            value={categories}
            options={categoryOptions}
            onChange={onCategoryChange}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-500">
          แสดง {showing} จาก {total} รายการ
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">มูลค่าสต็อกรวม</div>
            <div className="text-base font-semibold text-zinc-900">฿{fmt(totalValue)}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function CategoryMultiDropdown({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const normalizedOptions = useMemo(() => {
    const seen = new Set<string>();

    return options
      .map((option) => option.trim())
      .filter((option) => {
        if (!option || seen.has(option)) return false;
        seen.add(option);
        return true;
      });
  }, [options]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      option.toLowerCase().includes(keyword)
    );
  }, [normalizedOptions, query]);

  const selected = new Set(value);
  const label =
    value.length === 0
      ? "ประเภททั้งหมด"
      : value.length === 1
        ? value[0]
        : `${value.length} ประเภท`;

  const toggle = (option: string) => {
    onChange(
      selected.has(option)
        ? value.filter((item) => item !== option)
        : [...value, option]
    );
  };

  const openDropdown = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={ref} className="relative md:w-[260px]">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex h-[52px] w-full items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-left text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50"
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาประเภท..."
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-zinc-300 hover:text-zinc-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-auto py-1">
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded border ${
                  value.length === 0
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-zinc-300 bg-white"
                }`}
              >
                {value.length === 0 && <Check className="h-3 w-3" />}
              </span>
              ประเภททั้งหมด
            </button>

            {filtered.map((option) => {
              const active = selected.has(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded border ${
                      active
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-zinc-300 bg-white"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{option}</span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-zinc-400">
                ไม่พบประเภทที่ค้นหา
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
