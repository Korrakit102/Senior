import type { StatusTone } from "./types";

export function formatMonthThai(d: Date) {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  return `${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toDateLocal(value: string) {
  if (!value || typeof value !== "string") return new Date(NaN);

  const trimmed = value.trim();

  // รองรับ YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // รองรับ string จาก Date.toString()
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return new Date(NaN);
}

export function parseDateRange(range: string) {
  if (!range || typeof range !== "string") {
    return { startStr: "", endStr: "" };
  }

  const normalized = range.trim();

  // แบบ YYYY-MM-DD - YYYY-MM-DD
  const isoRangeMatch = normalized.match(
    /(\d{4}-\d{2}-\d{2})\s*[-–—]\s*(\d{4}-\d{2}-\d{2})/
  );
  if (isoRangeMatch) {
    return {
      startStr: isoRangeMatch[1],
      endStr: isoRangeMatch[2],
    };
  }

  // แบบ Date string - Date string
  // เช่น Sat Apr 18 2026 ... - Sun Apr 19 2026 ...
  const separator = " - ";
  const sepIndex = normalized.indexOf(separator);

  if (sepIndex !== -1) {
    const startStr = normalized.slice(0, sepIndex).trim();
    const endStr = normalized.slice(sepIndex + separator.length).trim();
    return { startStr, endStr };
  }

  // กรณีเป็นวันเดียว
  return {
    startStr: normalized,
    endStr: normalized,
  };
}

export function fmtDateShortThai(d: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateRangeThai(rangeStr: string): string {
  if (!rangeStr) return "-";
  const { startStr, endStr } = parseDateRange(rangeStr);
  const start = startStr ? toDateLocal(startStr) : null;
  const end = endStr ? toDateLocal(endStr) : null;
  const startFmt = fmtDateShortThai(start);
  const endFmt = fmtDateShortThai(end);
  if (!startStr || startFmt === "-") return rangeStr;
  if (!endStr || endStr === startStr || endFmt === startFmt) return startFmt;
  return `${startFmt} - ${endFmt}`;
}

export function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

export function getCalendarEventToneClass(tone: StatusTone) {
  if (tone === "pending") return "border-l-amber-500 bg-amber-50 text-amber-700";
  if (tone === "success") return "border-l-emerald-500 bg-emerald-50 text-emerald-700";
  if (tone === "progress") return "border-l-violet-500 bg-violet-50 text-violet-700";
  return "border-l-rose-500 bg-rose-50 text-rose-700";
}