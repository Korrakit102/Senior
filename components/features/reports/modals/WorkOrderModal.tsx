"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Plus, Search, Trash2, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type {
  EventReportRow,
  WorkOrderSalesTargetRow,
  WorkOrderSalesTargetTotals,
  WorkOrderSalesTargets,
} from "../types";
import { useDocumentSettings, type DocumentSettings } from "./useDocumentSettings";

interface Props {
  open: boolean;
  event: EventReportRow | null;
  onClose: () => void;
  onSaved?: (eventId: string, workOrderSalesTargets: WorkOrderSalesTargets) => void;
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

function fmtDate(d: string): string {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function fmt(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayTH(): string {
  return new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

type SalesTargetRow = WorkOrderSalesTargetRow;
type SalesTargetTotals = WorkOrderSalesTargetTotals;

function createSalesTargetRow(id: string): WorkOrderSalesTargetRow {
  return {
    id,
    displayModel: "",
    displayQty: "",
    testDriveModel: "",
    testDriveQty: "",
  };
}

function cloneSalesTargetRows(rows: SalesTargetRow[]): SalesTargetRow[] {
  return rows.map((row) => ({ ...row }));
}

const SALES_TARGET_COLUMNS: Array<keyof Omit<SalesTargetRow, "id">> = [
  "displayModel",
  "displayQty",
  "testDriveModel",
  "testDriveQty",
];

const DEFAULT_CAR_MODELS = [
  "D-MAX",
  "MU-X",
  "D-MAX X-Series",
  "D-MAX V-Cross",
  "D-MAX Spark",
];

function normalizeSalesTargets(
  value: WorkOrderSalesTargets | undefined
): WorkOrderSalesTargets {
  const rows =
    value?.rows && value.rows.length > 0
      ? value.rows.map((row, index) => ({
          id: row.id || `sales-target-${index + 1}`,
          displayModel: row.displayModel ?? "",
          displayQty: row.displayQty ?? "",
          testDriveModel: row.testDriveModel ?? "",
          testDriveQty: row.testDriveQty ?? "",
        }))
      : [createSalesTargetRow("sales-target-1")];

  const optionSet = new Set(
    [
      ...DEFAULT_CAR_MODELS,
      ...(value?.carModelOptions ?? []),
      ...rows.flatMap((row) => [row.displayModel, row.testDriveModel]),
    ]
      .map((option) => option.trim())
      .filter(Boolean)
  );

  return {
    rows,
    totals: {
      bookingTarget: value?.totals?.bookingTarget ?? "",
      interestedTarget: value?.totals?.interestedTarget ?? "",
    },
    carModelOptions: Array.from(optionSet),
  };
}

export default function WorkOrderModal({ open, event, onClose, onSaved }: Props) {
  const documentSettings = useDocumentSettings(open);

  useBodyScrollLock(open && Boolean(event));

  if (!open || !event) return null;

  return (
    <WorkOrderModalBody
      key={event.id}
      event={event}
      onClose={onClose}
      onSaved={onSaved}
      documentSettings={documentSettings}
    />
  );
}

function WorkOrderModalBody({
  event,
  onClose,
  onSaved,
  documentSettings,
}: {
  event: EventReportRow;
  onClose: () => void;
  onSaved?: (eventId: string, workOrderSalesTargets: WorkOrderSalesTargets) => void;
  documentSettings: DocumentSettings;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const initialSalesTargets = normalizeSalesTargets(event.workOrderSalesTargets);
  const [draftSalesTargets, setDraftSalesTargets] = useState<SalesTargetRow[]>(() =>
    cloneSalesTargetRows(initialSalesTargets.rows)
  );
  const [draftSalesTargetTotals, setDraftSalesTargetTotals] =
    useState<SalesTargetTotals>(() => ({ ...initialSalesTargets.totals }));
  const [savedSalesTargets, setSavedSalesTargets] = useState<SalesTargetRow[]>(() =>
    cloneSalesTargetRows(initialSalesTargets.rows)
  );
  const [savedSalesTargetTotals, setSavedSalesTargetTotals] =
    useState<SalesTargetTotals>(() => ({ ...initialSalesTargets.totals }));
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [carModelOptions, setCarModelOptions] = useState(initialSalesTargets.carModelOptions);

  const docNo = `WO-${event.id}`;

  const updateSalesTarget = (
    rowId: string,
    key: keyof Omit<SalesTargetRow, "id">,
    value: string
  ) => {
    setSaveMessage("");
    setSaveError("");
    setDraftSalesTargets((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  };

  const addSalesTargetRow = () => {
    setSaveMessage("");
    setSaveError("");
    setDraftSalesTargets((current) => [
      ...current,
      createSalesTargetRow(`sales-target-${current.length + 1}-${Date.now()}`),
    ]);
  };

  const removeSalesTargetRow = (rowId: string) => {
    setSaveMessage("");
    setSaveError("");
    setDraftSalesTargets((current) =>
      current.length > 1 ? current.filter((row) => row.id !== rowId) : current
    );
  };

  const updateSalesTargetTotals = (
    key: keyof SalesTargetTotals,
    value: string
  ) => {
    setSaveMessage("");
    setSaveError("");
    setDraftSalesTargetTotals((current) => ({ ...current, [key]: value }));
  };

  const handleSaveSalesTargets = async () => {
    setIsSavingTargets(true);
    setSaveError("");
    setSaveMessage("");

    const workOrderSalesTargets: WorkOrderSalesTargets = {
      rows: cloneSalesTargetRows(draftSalesTargets),
      totals: { ...draftSalesTargetTotals },
      carModelOptions,
    };

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderSalesTargets }),
      });
      if (!res.ok) throw new Error("failed to save work order targets");
      const data = (await res.json()) as {
        workOrderSalesTargets?: WorkOrderSalesTargets;
      };
      const saved = normalizeSalesTargets(
        data.workOrderSalesTargets ?? workOrderSalesTargets
      );
      setSavedSalesTargets(cloneSalesTargetRows(saved.rows));
      setSavedSalesTargetTotals({ ...saved.totals });
      setCarModelOptions(saved.carModelOptions);
      onSaved?.(event.id, saved);
      setSaveMessage("บันทึกเป้าหมายยอดขายแล้ว");
    } catch {
      setSaveError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSavingTargets(false);
    }
  };

  const addCarModelOption = (value: string) => {
    const next = value.trim();
    if (!next) return;
    setCarModelOptions((current) =>
      current.some((option) => option.toLowerCase() === next.toLowerCase())
        ? current
        : [...current, next]
    );
  };

  const handleDownload = useCallback(() => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const filename = `${docNo}_ใบสั่งงาน`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("กรุณาอนุญาตป๊อปอัปในเบราว์เซอร์เพื่อส่งออก PDF"); return; }
    win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"><title>${filename}</title>
  <style>
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 12mm; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #111; }
    @page { size: A4; margin: 12mm; }
    @media print { body { padding: 0; } }
    table { border-collapse: collapse; width: 100%; }
    td, th { vertical-align: top; }
    .print-red-tint {
      background-color: #fef2f2 !important;
      box-shadow: inset 0 0 0 9999px #fef2f2 !important;
    }
  </style>
</head><body>
  <div style="font-family:sans-serif;font-size:11px;color:#111;max-width:780px;margin:0 auto;">${content}</div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 300); });
    window.addEventListener('afterprint', function() { window.close(); });
  <\/script>
</body></html>`);
    win.document.close();
  }, [docNo]);

  const numDays = daysBetween(event.startDate, event.endDate);
  const totalCost = event.equipment.reduce(
    (sum, eq) => sum + eq.qty * eq.pricePerDayTHB * numDays, 0
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 p-2 sm:p-4">
      <div className="flex h-full min-h-0 items-start justify-center overflow-y-auto overscroll-contain py-4 sm:py-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">

        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <div className="text-base font-semibold text-zinc-900">ใบสั่งงาน</div>
            <div className="mt-0.5 text-xs text-zinc-400">{event.title} · {event.company}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลด PDF
            </button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-5">
          <div className="mb-3 text-sm font-semibold text-zinc-900">
            แก้ไขเป้าหมายยอดขาย
          </div>
          <div className="space-y-3">
            {draftSalesTargets.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-zinc-500">
                    รุ่นรถแถวที่ {index + 1}
                  </div>
                  {draftSalesTargets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSalesTargetRow(row.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-100 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      ลบ
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <EditableFieldLabel>ระบุรุ่นรถโชว์</EditableFieldLabel>
                    <CarModelDropdown
                      value={row.displayModel}
                      options={carModelOptions}
                      onChange={(value) =>
                        updateSalesTarget(row.id, "displayModel", value)
                      }
                      onAddOption={addCarModelOption}
                    />
                  </div>

                  <div>
                    <EditableFieldLabel>จำนวน</EditableFieldLabel>
                    <EditableInput
                      value={row.displayQty}
                      onChange={(value) =>
                        updateSalesTarget(row.id, "displayQty", value)
                      }
                      placeholder="จำนวน"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <EditableFieldLabel>ระบุรุ่นรถทดลองขับ</EditableFieldLabel>
                    <CarModelDropdown
                      value={row.testDriveModel}
                      options={carModelOptions}
                      onChange={(value) =>
                        updateSalesTarget(row.id, "testDriveModel", value)
                      }
                      onAddOption={addCarModelOption}
                    />
                  </div>

                  <div>
                    <EditableFieldLabel>จำนวน</EditableFieldLabel>
                    <EditableInput
                      value={row.testDriveQty}
                      onChange={(value) =>
                        updateSalesTarget(row.id, "testDriveQty", value)
                      }
                      placeholder="จำนวน"
                    />
                  </div>

                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-2">
              <div>
                <EditableFieldLabel>เป้าจองรวม</EditableFieldLabel>
                <EditableInput
                  value={draftSalesTargetTotals.bookingTarget}
                  onChange={(value) =>
                    updateSalesTargetTotals("bookingTarget", value)
                  }
                  placeholder="เป้าจองรวม"
                />
              </div>

              <div>
                <EditableFieldLabel>ยอดสนใจ</EditableFieldLabel>
                <EditableInput
                  value={draftSalesTargetTotals.interestedTarget}
                  onChange={(value) =>
                    updateSalesTargetTotals("interestedTarget", value)
                  }
                  placeholder="ยอดสนใจ"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={addSalesTargetRow}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                เพิ่มรุ่นรถ
              </button>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {saveMessage && (
                  <span className="text-xs font-medium text-emerald-600">
                    {saveMessage}
                  </span>
                )}
                {saveError && (
                  <span className="text-xs font-medium text-red-600">
                    {saveError}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveSalesTargets}
                  disabled={isSavingTargets}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingTargets ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Document preview */}
        <div className="p-6">
          <div
            ref={printRef}
            style={{ fontFamily: "sans-serif", fontSize: 11, color: "#111", background: "#fff", padding: 32 }}
            className="rounded-xl border border-zinc-200 shadow-sm"
          >
            <WorkOrderContent
              docNo={docNo}
              today={todayTH()}
              event={event}
              numDays={numDays}
              totalCost={totalCost}
              salesTargets={savedSalesTargets}
              salesTargetTotals={savedSalesTargetTotals}
              settings={documentSettings}
              fmt={fmt}
              fmtDate={fmtDate}
            />
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function EditableFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-xs font-semibold text-zinc-700">{children}</div>
  );
}

function EditableInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
    />
  );
}

function CarModelDropdown({
  value,
  options,
  onChange,
  onAddOption,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddOption: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, []);

  const normalizedOptions = useMemo(() => {
    const seen = new Set<string>();

    return options
      .map((option) => option.trim())
      .filter((option) => {
        const key = option.toLowerCase();
        if (!option || seen.has(key)) return false;
        seen.add(key);
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

  const queryText = query.trim();
  const exactExists = normalizedOptions.some(
    (option) => option.toLowerCase() === queryText.toLowerCase()
  );

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

  const select = (option: string) => {
    onChange(option);
    closeDropdown();
  };

  const addOption = () => {
    if (!queryText) return;
    onAddOption(queryText);
    select(queryText);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeDropdown() : openDropdown())}
        className={[
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left",
          open
            ? "border-zinc-400 ring-2 ring-zinc-200"
            : "border-zinc-200 hover:border-zinc-300",
        ].join(" ")}
      >
        <span className={value ? "truncate text-sm text-zinc-900" : "text-sm text-zinc-400"}>
          {value || "เลือกรุ่นรถ..."}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-[220] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ${
            dropUp ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหารุ่นรถ..."
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

          <ul className="max-h-44 overflow-auto py-1">
            {filtered.map((option) => {
              const active = option === value;

              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => select(option)}
                    className={[
                      "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                      active
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-zinc-700 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <span
                      className={`flex h-2 w-2 shrink-0 rounded-full ${
                        active ? "bg-blue-500" : "bg-transparent"
                      }`}
                    />
                    {option}
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-zinc-400">
                ไม่พบรุ่นรถที่ค้นหา
              </li>
            )}
          </ul>

          {queryText && !exactExists && (
            <div className="border-t border-zinc-100 p-2">
              <button
                type="button"
                onClick={addOption}
                className="w-full rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                {`+ เพิ่ม "${queryText}" เป็นรุ่นรถใหม่`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Document content ─── */
function WorkOrderContent({
  docNo, today, event, numDays, totalCost, salesTargets, salesTargetTotals, settings, fmt, fmtDate,
}: {
  docNo: string; today: string; event: EventReportRow;
  numDays: number; totalCost: number;
  salesTargets: SalesTargetRow[];
  salesTargetTotals: SalesTargetTotals;
  settings: DocumentSettings;
  fmt: (n: number) => string; fmtDate: (d: string) => string;
}) {
  const s = (v?: string | number | null) => (v != null && v !== "") ? String(v) : "-";

  const cell = (v: string) => (
    <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "center" }}>{v || "-"}</td>
  );

  const mergedCell = (v: string, rowSpan: number) => (
    <td rowSpan={rowSpan} style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "center", verticalAlign: "middle" }}>{v || "-"}</td>
  );

  return (
    <div style={{ fontSize: 11 }}>

      {/* ── Title ── */}
      <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "2px solid #dc2626", paddingBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>ใบสั่งงาน</div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{settings.companyName}</div>
      </div>

      {/* ── Header info grid ── */}
      <SectionLabel>ข้อมูลโครงการ</SectionLabel>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 10.5 }}>
        <tbody>
          <tr>
            <Cell label="เลขที่เอกสาร" value={docNo} />
            <Cell label="วันที่" value={today} />
          </tr>
          <tr>
            <Cell label="ผู้สั่งงาน / บริษัทลูกค้า" value={s(event.company)} />
            <Cell label="รหัสสาขา" value={s(event.branchCode)} />
          </tr>
          <tr>
            <Cell label="หัวหน้าโครงการ" value={s(event.contactName ?? event.organizer)} />
            <Cell label="เบอร์ติดต่อ" value={s(event.contactPhone)} />
          </tr>
          <tr>
            <td colSpan={4} style={{ border: "1px solid #e4e4e7", padding: "3px 8px" }}>
              <span style={{ color: "#888" }}>ชื่อการจัดงาน: </span>
              <strong>{s(event.title)}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ border: "1px solid #e4e4e7", padding: "3px 8px" }}>
              <span style={{ color: "#888" }}>สถานที่จัดงาน: </span>
              <strong>{s(event.place)}</strong>
            </td>
          </tr>
          <tr>
            <Cell label="จำนวนวันที่จัด" value={`${numDays} วัน`} />
            <Cell label="วันที่เริ่มงาน" value={fmtDate(event.startDate)} />
          </tr>
          <tr>
            <Cell label="วันที่สิ้นสุดงาน" value={fmtDate(event.endDate)} />
            <Cell label="จำนวนผู้เข้าร่วม" value={event.attendees ? `${event.attendees} คน` : "-"} />
          </tr>
          <tr>
            <Cell label="งบประมาณจัดงานทั้งหมด (บาท)" value={event.budgetTHB ? fmt(event.budgetTHB) : "-"} />
            <Cell label="ต้นทุนการจัดงาน (บาท)" value={fmt(totalCost)} />
          </tr>
        </tbody>
      </table>

      {/* ── Event format ── */}
      <SectionLabel>รูปแบบและเป้าหมายงาน</SectionLabel>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 10.5 }}>
        <tbody>
          <tr>
            <Cell label="รูปแบบงาน" value="-" />
            <Cell label="จำนวนผู้ร่วมงาน" value={event.attendees ? `${event.attendees} คน` : "-"} />
          </tr>
          <tr>
            <Cell label="ลักษณะงาน" value="-" />
            <Cell label="ขนาดการจัดงาน" value="-" />
          </tr>
          <tr>
            <td colSpan={4} style={{ border: "1px solid #e4e4e7", padding: "3px 8px" }}>
              <span style={{ color: "#888" }}>ประเภทงาน: </span>-
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Equipment list ── */}
      <SectionLabel>รายการอุปกรณ์และบริการ</SectionLabel>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 10 }}>
        <thead>
          <tr className="print-red-tint" style={{ background: "#fef2f2", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {["#", "รายการอุปกรณ์", "หมวดหมู่", "จำนวน", `ราคา/วัน (฿)`, "รวม (฿)"].map((h) => (
              <th key={h} style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: ["#", "จำนวน"].includes(h) ? "center" : h.startsWith("ราคา") || h === "รวม (฿)" ? "right" : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {event.equipment.length === 0 ? (
            <tr><td colSpan={6} style={{ border: "1px solid #e4e4e7", padding: "8px", textAlign: "center", color: "#aaa" }}>ไม่มีรายการอุปกรณ์</td></tr>
          ) : (
            event.equipment.map((eq, i) => {
              const lineTotal = eq.qty * eq.pricePerDayTHB * numDays;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "center", color: "#888" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px" }}>{eq.name}</td>
                  <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", color: "#555" }}>{eq.category || "-"}</td>
                  <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "center" }}>{eq.qty}</td>
                  <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "right" }}>{fmt(eq.pricePerDayTHB)}</td>
                  <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "right", fontWeight: 600 }}>{fmt(lineTotal)}</td>
                </tr>
              );
            })
          )}
          <tr className="print-red-tint" style={{ background: "#fef2f2", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <td colSpan={5} style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ต้นทุนรวม ({numDays} วัน)</td>
            <td style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{fmt(totalCost)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Sales targets ── */}
      <SectionLabel>เป้าหมายยอดขาย</SectionLabel>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 9.5 }}>
        <thead>
          <tr className="print-red-tint" style={{ background: "#fef2f2", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {["ระบุรุ่นรถโชว์", "จำนวน", "ระบุรุ่นรถทดลองขับ", "จำนวน", "เป้าจองรวม", "ยอดสนใจ"].map((h, index) => (
              <th key={`${h}-${index}`} style={{ border: "1px solid #e4e4e7", padding: "4px 4px", textAlign: "center", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {salesTargets.map((row, index) => (
            <tr key={row.id}>
              {SALES_TARGET_COLUMNS.map((column) => (
                <React.Fragment key={column}>{cell(row[column])}</React.Fragment>
              ))}
              {index === 0 && (
                <>
                  {mergedCell(salesTargetTotals.bookingTarget, salesTargets.length)}
                  {mergedCell(salesTargetTotals.interestedTarget, salesTargets.length)}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Details ── */}
      {event.description && (
        <>
          <SectionLabel>รายละเอียดการจัดงาน</SectionLabel>
          <div style={{ border: "1px solid #e4e4e7", borderRadius: 4, padding: "8px 10px", fontSize: 10.5, whiteSpace: "pre-wrap", minHeight: 60, marginBottom: 16, color: "#333" }}>
            {event.description}
          </div>
        </>
      )}

      {/* ── Signatures ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, marginTop: 40 }}>
        {[`${settings.companyName} (ผู้รับงาน)`, event.company || "ผู้สั่งงาน"].map((name) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #999", paddingTop: 8, marginTop: 48, color: "#555", fontSize: 10 }}>
              ลายเซ็น / {name}
            </div>
            <div style={{ marginTop: 4, color: "#aaa", fontSize: 9 }}>วันที่ _______________</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-red-tint" style={{ background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 10.5, padding: "5px 10px", borderRadius: "4px 4px 0 0", marginBottom: 0, borderLeft: "3px solid #dc2626", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      {children}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <>
      <td style={{ border: "1px solid #e4e4e7", padding: "3px 8px", color: "#888", width: "18%", whiteSpace: "nowrap" }}>{label}</td>
      <td style={{ border: "1px solid #e4e4e7", padding: "3px 8px", width: "32%" }}>{value}</td>
    </>
  );
}
