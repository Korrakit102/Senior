"use client";

import React, { useCallback, useRef } from "react";
import { X, Download } from "lucide-react";
import type { EventReportRow } from "../types";

type DocType = "quotation" | "invoice";

interface Props {
  open: boolean;
  docType: DocType;
  event: EventReportRow | null;
  onClose: () => void;
}

const COMPANY = {
  name: "บริษัท เอช.บี.ไมซ์ จำกัด (สำนักงานใหญ่)",
  address: "255 หมู่ที่ 2 ตำบลสันทราย อำเภอเมืองเชียงราย จังหวัดเชียงราย 57000",
  taxId: "0575559000545",
  phone: "095-1450808",
  email: "hbmiceinfo1@gmail.com",
  bankName: "บริษัท เอช.บี.ไมซ์ จำกัด",
  bankBranch: "ธนาคารกรุงไทย สาขาห้าแยกพ่อขุนเม็งราย ออมทรัพย์",
  bankAccount: "539-0-49495-4",
};

const SECTIONS = ["สถานที่", "ค่าตกแต่ง", "บันเทิง"] as const;

function categorize(category: string): 0 | 1 | 2 {
  const c = (category ?? "").toLowerCase();
  if (c.includes("ตกแต่ง") || c.includes("แสง") || c.includes("led") || c.includes("ไฟ") || c.includes("ดอก")) return 1;
  if (c.includes("เสียง") || c.includes("บันเทิง") || c.includes("ดนตรี") || c.includes("วง") || c.includes("สกรีน")) return 2;
  return 0;
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

export default function QuotationInvoiceModal({ open, docType, event, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const docTitle = docType === "quotation" ? "ใบเสนอราคา" : "ใบแจ้งหนี้";
  const docPrefix = docType === "quotation" ? "QUO" : "INV";
  const docNo = event ? `${docPrefix}-${event.id}` : "-";

  const handleDownload = useCallback(() => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const filename = `${docNo}_${docTitle}`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("กรุณาอนุญาต popup ในเบราว์เซอร์เพื่อ export PDF"); return; }
    win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"><title>${filename}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 12mm; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #111; }
    @page { size: A4; margin: 12mm; }
    @media print { body { padding: 0; } }
    table { border-collapse: collapse; width: 100%; }
    td, th { vertical-align: top; }
  </style>
</head><body>
  <div style="font-family:sans-serif;font-size:11px;color:#111;max-width:780px;margin:0 auto;">${content}</div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 300); });
    window.addEventListener('afterprint', function() { window.close(); });
  <\/script>
</body></html>`);
    win.document.close();
  }, [docNo, docTitle]);

  if (!open || !event) return null;

  const numDays = daysBetween(event.startDate, event.endDate);
  const sections: typeof event.equipment[] = [[], [], []];
  for (const eq of event.equipment) {
    sections[categorize(eq.category)].push(eq);
  }

  const sectionTotals = sections.map((s) =>
    s.reduce((sum, eq) => sum + eq.qty * eq.pricePerDayTHB * numDays, 0)
  );
  const grandTotal = sectionTotals.reduce((a, b) => a + b, 0);
  const vat = grandTotal * 0.07;
  const wht = grandTotal * 0.03;
  const netTotal = grandTotal + vat;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <div className="text-base font-semibold text-zinc-900">{docTitle}</div>
            <div className="mt-0.5 text-xs text-zinc-400">{event.title} · {event.company}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document preview */}
        <div className="p-6">
          <div
            ref={printRef}
            style={{ fontFamily: "sans-serif", fontSize: 11, color: "#111", background: "#fff", padding: 32 }}
            className="rounded-xl border border-zinc-200 shadow-sm"
          >
            <DocContent
              docTitle={docTitle}
              docNo={docNo}
              today={todayTH()}
              event={event}
              numDays={numDays}
              sections={sections}
              sectionTotals={sectionTotals}
              grandTotal={grandTotal}
              vat={vat}
              wht={wht}
              netTotal={netTotal}
              fmt={fmt}
              fmtDate={fmtDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Document content (rendered both on-screen & in print window) ─── */
function DocContent({
  docTitle, docNo, today, event, numDays, sections, sectionTotals,
  grandTotal, vat, wht, netTotal, fmt, fmtDate,
}: {
  docTitle: string; docNo: string; today: string;
  event: EventReportRow; numDays: number;
  sections: EventReportRow["equipment"][]; sectionTotals: number[];
  grandTotal: number; vat: number; wht: number; netTotal: number;
  fmt: (n: number) => string; fmtDate: (d: string) => string;
}) {
  const s = (v?: string | null) => v || "-";

  return (
    <div style={{ fontSize: 11 }}>

      {/* ── Company header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #dc2626", paddingBottom: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>{COMPANY.name}</div>
          <div style={{ marginTop: 3, color: "#555", lineHeight: 1.6 }}>{COMPANY.address}</div>
          <div style={{ color: "#555" }}>เลขประจำตัวผู้เสียภาษี: {COMPANY.taxId}</div>
          <div style={{ color: "#555" }}>โทร: {COMPANY.phone} | Email: {COMPANY.email}</div>
        </div>
        <div style={{ textAlign: "right", minWidth: 180 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>{docTitle}</div>
          <div style={{ marginTop: 6, lineHeight: 1.8 }}>
            <div>เลขที่: <strong>{docNo}</strong></div>
            <div>วันที่: <strong>{today}</strong></div>
          </div>
        </div>
      </div>

      {/* ── Customer & event info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 10.5 }}>
        <InfoRow label="ชื่อลูกค้า / บริษัท" value={s(event.company)} />
        <InfoRow label="เบอร์ติดต่อ" value={s(event.contactPhone)} />
        <div style={{ gridColumn: "1/-1" }}>
          <InfoRow label="ผู้ติดต่อ" value={s(event.contactName ?? event.organizer)} />
        </div>
        <InfoRow label="รหัสสาขา" value={s(event.branchCode)} />
        <InfoRow label="ชื่อการจัดงาน" value={s(event.title)} />
        <InfoRow label="สถานที่จัดงาน" value={s(event.place)} />
        <InfoRow label="วันที่เริ่ม" value={fmtDate(event.startDate)} />
        <InfoRow label="วันที่สิ้นสุด" value={fmtDate(event.endDate)} />
        <InfoRow label="จำนวนวัน" value={`${numDays} วัน`} />
      </div>

      {/* ── Equipment sections ── */}
      {(["สถานที่", "ค่าตกแต่ง", "บันเทิง"] as const).map((label, si) => (
        <div key={si} style={{ marginBottom: 14 }}>
          <div style={{ background: "#dc2626", color: "#fff", padding: "4px 8px", fontWeight: 600, borderRadius: "4px 4px 0 0", fontSize: 10.5 }}>
            หมวด {si + 1}: {label}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ background: "#fef2f2" }}>
                {["รายละเอียด", "หมวดหมู่", "จำนวน", `ราคา/วัน (฿)`, `${numDays} วัน × ราคา (฿)`, "ราคารวม (฿)"].map((h) => (
                  <th key={h} style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: h === "รายละเอียด" || h === "หมวดหมู่" ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections[si].length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ border: "1px solid #e4e4e7", padding: "6px 8px", color: "#aaa", textAlign: "center" }}>-</td>
                </tr>
              ) : (
                sections[si].map((eq, i) => {
                  const lineTotal = eq.qty * eq.pricePerDayTHB * numDays;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px" }}>{eq.name}</td>
                      <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", color: "#555" }}>{s(eq.category)}</td>
                      <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "right" }}>{eq.qty}</td>
                      <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "right" }}>{fmt(eq.pricePerDayTHB)}</td>
                      <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "right" }}>{fmt(eq.pricePerDayTHB * numDays)}</td>
                      <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "right", fontWeight: 600 }}>{fmt(lineTotal)}</td>
                    </tr>
                  );
                })
              )}
              <tr style={{ background: "#fef2f2" }}>
                <td colSpan={5} style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>รวม{label}</td>
                <td style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(sectionTotals[si])}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* ── Summary + notes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16, marginTop: 8 }}>
        {/* Notes */}
        <div style={{ background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, padding: 10, fontSize: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>หมายเหตุ / เงื่อนไขการชำระเงิน</div>
          <ul style={{ paddingLeft: 14, color: "#555", lineHeight: 1.8, margin: 0 }}>
            <li>ยืนยันราคา 3 วันนับจากวันที่เสนอราคา</li>
            <li>ภาษีหัก ณ ที่จ่าย 3%</li>
            <li>ภาษีมูลค่าเพิ่ม 7%</li>
            <li>ผู้ว่าจ้างที่เป็นบริษัท มีหน้าที่หักภาษี ณ ที่จ่าย 3% จากยอดค่าใช้จ่าย (ไม่รวม VAT) ตั้งแต่ 1,000 บาทขึ้นไป</li>
          </ul>
          <div style={{ marginTop: 10, fontWeight: 600 }}>ข้อมูลการชำระเงิน</div>
          <div style={{ color: "#555", lineHeight: 1.8, marginTop: 4 }}>
            <div>ชื่อบัญชี: {COMPANY.bankName}</div>
            <div>{COMPANY.bankBranch}</div>
            <div>เลขที่บัญชี: {COMPANY.bankAccount}</div>
            <div>โอนเงินและเมลยืนยันที่ {COMPANY.email}</div>
          </div>
        </div>

        {/* Totals */}
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <tbody>
              <TotalRow label="Total Amount รวม" value={fmt(grandTotal)} />
              <TotalRow label="ภาษีมูลค่าเพิ่ม 7%" value={fmt(vat)} />
              <TotalRow label="หัก ณ ที่จ่าย 3%" value={`(${fmt(wht)})`} dim />
              <tr style={{ borderTop: "2px solid #dc2626" }}>
                <td style={{ padding: "6px 6px", fontWeight: 700 }}>จำนวนเงินทั้งสิ้น</td>
                <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#dc2626" }}>{fmt(netTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, marginTop: 48 }}>
        {[COMPANY.bankName, s(event.company)].map((name) => (
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "#888" }}>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

function TotalRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <tr>
      <td style={{ padding: "3px 6px", color: dim ? "#888" : "#444" }}>{label}</td>
      <td style={{ padding: "3px 6px", textAlign: "right", color: dim ? "#888" : "#111" }}>{value}</td>
    </tr>
  );
}
