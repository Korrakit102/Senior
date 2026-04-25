import { categoryLabel } from "./constants";
import type {
  AppStock,
  DamageRow,
  DocCategory,
  DocRow,
  EventReportRow,
  FinanceSummary,
  ReportTab,
  StockReportRow,
} from "./types";

export function exportToExcel(
  sheetName: string,
  filename: string,
  data: (string | number)[][]
) {
  import("xlsx")
    .then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet(data);

      const colWidths = data[0].map((_, colIdx) =>
        Math.min(
          40,
          Math.max(10, ...data.map((row) => String(row[colIdx] ?? "").length))
        )
      );

      ws["!cols"] = colWidths.map((w) => ({ wch: w }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `${filename}-${today}.xlsx`);
    })
    .catch(() => {
      alert("กรุณาติดตั้ง xlsx ก่อน:\nnpm install xlsx");
    });
}

export function mapStockRows(stockData: AppStock[]): StockReportRow[] {
  return stockData.map((r) => ({
    name: r.name,
    code: `${r.brand} - ${r.code}`,
    type: r.system,
    warehouse: r.zone,
    qty: r.qty,
    ready: r.available,
    pricePerDay: r.pricePerDay,
    cost: r.cost,
  }));
}

export function getSearchPlaceholder(tab: ReportTab) {
  if (tab === "stock") {
    return "ค้นหาอุปกรณ์ ชื่อ, รหัส, ชนิด, หมวดหมู่...";
  }

  if (tab === "events") {
    return "ค้นหา Event, บริษัท...";
  }

  if (tab === "damage") {
    return "ค้นหาอุปกรณ์ที่เสียหาย, รหัส, Event...";
  }

  return "ค้นหาเอกสาร, Event, บริษัท...";
}

export function getDocStats(docsRows: DocRow[]) {
  return {
    total: docsRows.length,
    invoice: docsRows.filter((d) => d.category === "invoice").length,
    quotation: docsRows.filter((d) => d.category === "quotation").length,
    workorder: docsRows.filter((d) => d.category === "workorder").length,
    other: docsRows.filter(
      (d) => !["invoice", "quotation", "workorder"].includes(d.category)
    ).length,
  };
}

export function filterStockRows(rows: StockReportRow[], query: string) {
  const s = query.trim().toLowerCase();
  if (!s) return rows;

  return rows.filter((r) =>
    [r.name, r.code, r.type, r.warehouse].some((v) =>
      v.toLowerCase().includes(s)
    )
  );
}

export function filterEventRows(rows: EventReportRow[], query: string) {
  const s = query.trim().toLowerCase();
  if (!s) return rows;

  return rows.filter((e) =>
    [e.title, e.company, e.id].some((v) => v.toLowerCase().includes(s))
  );
}

export function filterDamageRows(rows: DamageRow[], query: string) {
  const s = query.trim().toLowerCase();
  if (!s) return rows;

  return rows.filter((d) =>
    [d.itemName, d.code, d.eventId ?? ""].some((v) =>
      v.toLowerCase().includes(s)
    )
  );
}

export function filterDocsRows(
  rows: DocRow[],
  query: string,
  docCategory: "all" | DocCategory,
  docSort: "newest" | "oldest"
) {
  let filtered = rows;

  if (docCategory !== "all") {
    filtered = filtered.filter((r) => r.category === docCategory);
  }

  const s = query.trim().toLowerCase();
  if (s) {
    filtered = filtered.filter((r) =>
      [r.title, r.owner, r.eventOrCompany, r.description].some((v) =>
        v.toLowerCase().includes(s)
      )
    );
  }

  return [...filtered].sort((a, b) =>
    docSort === "newest"
      ? b.uploadedAtISO.localeCompare(a.uploadedAtISO)
      : a.uploadedAtISO.localeCompare(b.uploadedAtISO)
  );
}

export function buildStockExportData(rows: StockReportRow[]) {
  return [
    [
      "ชื่ออุปกรณ์",
      "รหัส",
      "ประเภท",
      "โกดัง",
      "จำนวนรวม",
      "พร้อมใช้",
      "ใช้งานอยู่",
      "ราคา/วัน (฿)",
      "ราคาต้นทุน (฿)",
    ],
    ...rows.map((r) => [
      r.name,
      r.code,
      r.type,
      r.warehouse,
      r.qty,
      r.ready,
      r.qty - r.ready,
      r.pricePerDay,
      r.cost,
    ]),
  ];
}

export function buildEventsExportData(rows: EventReportRow[]) {
  return [
    [
      "ID",
      "ชื่อ Event",
      "บริษัท",
      "วันที่",
      "สถานะ",
      "รายได้ (฿)",
      "อุปกรณ์ (รายการ)",
    ],
    ...rows.map((e) => [
      e.id,
      e.title,
      e.company,
      e.date,
      e.status.text,
      e.revenue,
      e.equipmentCount,
    ]),
  ];
}

export function buildDocsExportData(rows: DocRow[]) {
  return [
    [
      "ID",
      "ชื่อเอกสาร",
      "ทีม",
      "หมวดหมู่",
      "Event / บริษัท",
      "คำอธิบาย",
      "วันที่อัปโหลด",
    ],
    ...rows.map((d) => [
      d.id,
      d.title,
      d.owner,
      categoryLabel[d.category],
      d.eventOrCompany.replace(/\n/g, " | "),
      d.description,
      d.uploadedAt,
    ]),
  ];
}

export function buildDamageExportData(rows: DamageRow[]) {
  return [
    ["ID", "ชื่อ Event", "รหัส", "วันที่", "มูลค่าอุปกรณ์ (฿)", "สถานะ"],
    ...rows.map((d) => [
      d.id,
      d.itemName,
      d.code,
      d.date,
      d.cost,
      d.status === "reported" ? "แจ้งซ่อมแล้ว" : "ซ่อมแล้ว",
    ]),
  ];
}

export function getDefaultFinanceSummary(): FinanceSummary {
  return {
    totalRevenue: 0,
    totalEvents: 0,
    avgPerEvent: 0,
    topEvents: [],
  };
}