"use client";

import React, { useCallback, useRef } from "react";
import { X, Download } from "lucide-react";
import type { EventReportRow } from "../types";

interface Props {
  open: boolean;
  event: EventReportRow | null;
  onClose: () => void;
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

export default function WorkOrderModal({ open, event, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const docNo = event ? `WO-${event.id}` : "-";

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
  }, [docNo]);

  if (!open || !event) return null;

  const numDays = daysBetween(event.startDate, event.endDate);
  const totalCost = event.equipment.reduce(
    (sum, eq) => sum + eq.qty * eq.pricePerDayTHB * numDays, 0
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
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
              fmt={fmt}
              fmtDate={fmtDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Document content ─── */
function WorkOrderContent({
  docNo, today, event, numDays, totalCost, fmt, fmtDate,
}: {
  docNo: string; today: string; event: EventReportRow;
  numDays: number; totalCost: number;
  fmt: (n: number) => string; fmtDate: (d: string) => string;
}) {
  const s = (v?: string | number | null) => (v != null && v !== "") ? String(v) : "-";

  const cell = (v: string) => (
    <td style={{ border: "1px solid #e4e4e7", padding: "3px 6px", textAlign: "center" }}>{v || "-"}</td>
  );

  return (
    <div style={{ fontSize: 11 }}>

      {/* ── Title ── */}
      <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "2px solid #dc2626", paddingBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>ใบสั่งงาน</div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>บริษัท เอช.บี.ไมซ์ จำกัด (สำนักงานใหญ่)</div>
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
            <Cell label="เข้าโครงการ TIS" value="-" />
            <Cell label="ชื่อโครงการตาม TIS" value="-" />
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
          <tr style={{ background: "#fef2f2" }}>
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
          <tr style={{ background: "#fef2f2" }}>
            <td colSpan={5} style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ต้นทุนรวม ({numDays} วัน)</td>
            <td style={{ border: "1px solid #e4e4e7", padding: "4px 6px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{fmt(totalCost)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Sales targets ── */}
      <SectionLabel>เป้าหมายยอดขาย</SectionLabel>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 9.5 }}>
        <thead>
          <tr style={{ background: "#fef2f2" }}>
            {["ระบุรุ่นรถโชว์", "จำนวน", "ระบุรุ่นรถทดลองขับ", "จำนวน", "เป้าจองรวม", "ยอดสนใจ", "เป้ารถกระบะ", "เป้า MU-X", "เป้า 4×4", "เป้ารถบรรทุก"].map((h) => (
              <th key={h} style={{ border: "1px solid #e4e4e7", padding: "4px 4px", textAlign: "center", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {Array(10).fill(null).map((_, i) => cell(""))}
          </tr>
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
        {["บริษัท เอช.บี.ไมซ์ จำกัด (ผู้รับงาน)", event.company || "ผู้สั่งงาน"].map((name) => (
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
    <div style={{ background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 10.5, padding: "5px 10px", borderRadius: "4px 4px 0 0", marginBottom: 0, borderLeft: "3px solid #dc2626" }}>
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
