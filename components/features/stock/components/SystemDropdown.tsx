"use client";

import React, { useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { SYSTEM_OPTIONS } from "../constants";

type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options?: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  addLabel?: (query: string) => string;
  allowCreate?: boolean;
};

export default function SystemDropdown({
  value,
  onChange,
  error,
  options = SYSTEM_OPTIONS,
  placeholder = "เลือกหมวดหมู่...",
  searchPlaceholder = "ค้นหาหมวดหมู่...",
  emptyLabel = "ไม่พบหมวดหมู่ที่ค้นหา",
  addLabel = (query) => `+ เพิ่ม "${query}" เป็นหมวดหมู่ใหม่`,
  allowCreate = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeDropdown();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const openDropdown = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropUp(spaceBelow < 280 && spaceAbove > spaceBelow);
    }
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeDropdown = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (opt: string) => {
    onChange(opt);
    closeDropdown();
  };

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return options;
    return options.filter((o) => o.toLowerCase().includes(kw));
  }, [options, query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeDropdown() : openDropdown())}
        className={[
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50 px-3 text-left",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : open
              ? "border-zinc-400 ring-2 ring-zinc-200"
              : "border-zinc-200 hover:border-zinc-300",
        ].join(" ")}
      >
        <span className={value ? "text-sm text-zinc-900" : "text-sm text-zinc-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-[200] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ${
            dropUp ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
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

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-5 text-center">
              <span className="text-sm text-zinc-400">{emptyLabel}</span>
              {allowCreate && query.trim() && (
                <button
                  type="button"
                  onClick={() => select(query.trim())}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {addLabel(query.trim())}
                </button>
              )}
            </div>
          ) : (
            <ul className="max-h-44 overflow-auto py-1">
              {filtered.map((opt) => {
                const active = opt === value;

                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => select(opt)}
                      className={[
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                        active
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-zinc-700 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-2 w-2 shrink-0 rounded-full",
                          active ? "bg-blue-500" : "bg-transparent",
                        ].join(" ")}
                      />
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}
