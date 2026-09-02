import type { Category, ItemStatus, StockRow } from "./types";

export function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

export function getStatusTone(status: ItemStatus): "green" | "blue" | "amber" {
  if (status === "พร้อมใช้") return "green";
  if (status === "ใช้งานอยู่") return "blue";
  return "amber";
}

// สถานะหลักที่ควรแสดงบน badge โดยพิจารณาจากจำนวนพร้อมใช้/กำลังซ่อมจริง แทนการอ่าน field status ดิบตรงๆ:
// - พร้อมใช้ > 0 → "พร้อมใช้" (ยังเบิกได้ แม้จะมีบางส่วนซ่อมอยู่ก็ตาม)
// - พร้อมใช้ = 0 และมีของกำลังซ่อม → "ซ่อมแซม"
// - พร้อมใช้ = 0 และไม่มีของซ่อม (ถูกเบิกไปใช้อีเวนต์ทั้งหมด) → "ใช้งานอยู่"
export function getDisplayStatus(row: StockRow): ItemStatus {
  if (row.available > 0) return "พร้อมใช้";
  if (row.repairing > 0) return "ซ่อมแซม";
  return "ใช้งานอยู่";
}

export function getCategoryTone(category: Category): "amber" | "zinc" {
  return category === "ไฟฟ้า" ? "amber" : "zinc";
}

export function getNextStockId(stockData: StockRow[]) {
  let max = 0;

  for (const r of stockData) {
    const normalized = r.id.replace("-", "");
    const m = normalized.match(/^EQ(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }

  return `EQ-${String(max + 1).padStart(3, "0")}`;
}

export function getCodePrefix(category: Category) {
  if (category === "ไฟฟ้า") return "LT";
  if (category === "ผ้าใบ") return "ST";
  return "GR";
}

export function filterStockRows(
  stockData: StockRow[],
  q: string,
  status: "ทั้งหมด" | ItemStatus,
  category: "ทั้งหมด" | Category
) {
  return stockData.filter((r) => {
    const hitQ =
      q.trim().length === 0 ||
      [r.id, r.code, r.name, r.brand, r.system, r.zone].some((x) =>
        x.toLowerCase().includes(q.toLowerCase())
      );

    const hitStatus =
      status === "ทั้งหมด" ||
      (status === "ซ่อมแซม" ? r.repairing > 0 : getDisplayStatus(r) === status);

    return (
      hitQ &&
      hitStatus &&
      (category === "ทั้งหมด" || r.category === category)
    );
  });
}

export function getStockStats(stockData: StockRow[]) {
  return {
    total: stockData.reduce((s, r) => s + r.qty, 0),
    ready: stockData.reduce((s, r) => s + r.available, 0),
    inUse: stockData.reduce((s, r) => s + (r.qty - r.available), 0),
    repair: stockData.reduce((s, r) => s + r.repairing, 0),
  };
}

export function exportStockToExcel(rows: StockRow[]) {
  import("xlsx")
    .then((XLSX) => {
      const data = [
        [
          "รหัสระบบ",
          "รหัส",
          "ชื่ออุปกรณ์",
          "ยี่ห้อ",
          "ประเภท",
          "หมวดหมู่",
          "โซน",
          "สถานะ",
          "จำนวนรวม",
          "พร้อมใช้",
          "ใช้งานอยู่",
          "ค่าบริการ/วัน (฿)",
          "ราคาต้นทุน (฿)",
        ],
        ...rows.map((r) => [
          r.id,
          r.code,
          r.name,
          r.brand,
          r.category,
          r.system,
          r.zone,
          r.status,
          r.qty,
          r.available,
          r.qty - r.available,
          r.pricePerDay,
          r.cost,
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);

      ws["!cols"] = [
        { wch: 8 },
        { wch: 10 },
        { wch: 28 },
        { wch: 14 },
        { wch: 10 },
        { wch: 16 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "สต็อก");
      XLSX.writeFile(wb, `stock-${new Date().toISOString().split("T")[0]}.xlsx`);
    })
    .catch(() => {
      alert("กรุณาติดตั้ง xlsx ก่อน:\nnpm install xlsx");
    });
}
