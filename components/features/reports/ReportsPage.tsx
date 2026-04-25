"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { Role } from "../../AppShell";
import type {
  AppStock,
  DamageRow,
  DocCategory,
  DocRow,
  EventReportRow,
  FinanceSummary,
  ReportTab,
} from "./types";
import {
  buildDamageExportData,
  buildDocsExportData,
  buildEventsExportData,
  buildStockExportData,
  exportToExcel,
  filterDamageRows,
  filterDocsRows,
  filterEventRows,
  filterStockRows,
  getDocStats,
  getSearchPlaceholder,
  mapStockRows,
} from "./helpers";

import ReportsHeader from "./components/ReportsHeader";
import ReportsTabs from "./components/ReportsTabs";
import ReportsSearchBar from "./components/ReportsSearchBar";
import ReportsSummaryCard from "./components/ReportsSummaryCard";

import FinanceReportSection from "./components/FinanceReportSection";
import StockReportSection from "./components/StockReportSection";
import EventsReportSection from "./components/EventsReportSection";
import DamageReportSection from "./components/DamageReportSection";
import DocsReportSection from "./components/DocsReportSection";

import ReportDocDetailModal from "./modals/ReportDocDetailModal";
import ConfirmDeleteDocModal from "./modals/ConfirmDeleteDocModal";
import AddDocModal from "./modals/AddDocModal";

function daysBetween(range: string): number {
  const parts = range.split(" - ");
  if (parts.length < 2) return 1;
  const a = parts[0].trim().split("-").map(Number);
  const b = parts[1].trim().split("-").map(Number);
  if (a.length < 3 || b.length < 3 || !a[0] || !b[0]) return 1;
  const s = Date.UTC(a[0], a[1] - 1, a[2]);
  const e = Date.UTC(b[0], b[1] - 1, b[2]);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

type Props = {
  role: Role;
  stockData: AppStock[];
  extraDamageRows?: DamageRow[];
};

export default function ReportsPage({ role, stockData, extraDamageRows }: Props) {
  const [tab, setTab] = useState<ReportTab>(
    role === "Stockkeeper" ? "stock" : "finance"
  );
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocRow | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocRow | null>(null);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docCategory, setDocCategory] = useState<"all" | DocCategory>("all");
  const [docSort, setDocSort] = useState<"newest" | "oldest">("newest");
  const [eventReportRows, setEventReportRows] = useState<EventReportRow[]>([]);

  const [docsRows, setDocsRows] = useState<DocRow[]>([
    {
      id: "DOC001",
      title: "ใบสั่งงาน - งานเลี้ยงปีใหม่",
      owner: "Stockkeeper Team",
      category: "workorder",
      eventOrCompany:
        "งานเลี้ยงปีใหม่ 2025\nบริษัท ตัวอย่าง จำกัด\n31 ธ.ค. - 1 ม.ค.",
      description: "ใบสั่งงานเตรียมอุปกรณ์งานเลี้ยงฉลองปีใหม่",
      uploadedAt: "20 พ.ย. 2567",
      uploadedAtISO: "2024-11-20",
      sizeLabel: "22 MB",
    },
    {
      id: "DOC002",
      title: "รายงานตรวจสอบอุปกรณ์ประจำเดือน",
      owner: "Stockkeeper Team",
      category: "report",
      eventOrCompany: "-",
      description: "รายงานการตรวจสอบสภาพอุปกรณ์ทั้งหมดประจำเดือนมิถุนายน",
      uploadedAt: "30 มิ.ย. 2567",
      uploadedAtISO: "2024-06-30",
      sizeLabel: "19 MB",
    },
    {
      id: "DOC003",
      title: "สัญญาเช่าอุปกรณ์ระยะยาว",
      owner: "Manager Team",
      category: "contract",
      eventOrCompany:
        "โครงการพัฒนาพนักงาน\nบริษัท HR Solutions จำกัด\n1 ต.ค. - 31 ธ.ค.",
      description: "สัญญาเช่าอุปกรณ์สำหรับงานต่อเนื่อง 6 เดือน",
      uploadedAt: "1 มี.ค. 2567",
      uploadedAtISO: "2024-03-01",
      sizeLabel: "3.5 MB",
    },
    {
      id: "DOC004",
      title: "ใบเสนอราคา - งานแสดงสินค้า Trade Show",
      owner: "Manager Team",
      category: "quotation",
      eventOrCompany:
        "Trade Show International 2024\nบริษัท เทคอินโนเวชั่นส์ จำกัด\n5 ก.ค. - 8 ก.ค.",
      description: "ใบเสนอราคาอุปกรณ์สำหรับงานแสดงสินค้านานาชาติ",
      uploadedAt: "15 พ.ค. 2567",
      uploadedAtISO: "2024-05-15",
      sizeLabel: "4.8 MB",
    },
    {
      id: "DOC005",
      title: "ใบแจ้งหนี้ - งานสัมมนาผู้บริหาร",
      owner: "SA Team",
      category: "invoice",
      eventOrCompany:
        "งานสัมมนาผู้บริหาร 2024\nบริษัท ไมน์ครุต จำกัด\n10 มิ.ย. - 12 มิ.ย.",
      description: "ใบแจ้งหนี้งานจัดสัมมนาผู้บริหารระดับสูง",
      uploadedAt: "5 เม.ย. 2567",
      uploadedAtISO: "2024-04-05",
      sizeLabel: "3.1 MB",
    },
    {
      id: "DOC006",
      title: "ใบแจ้งหนี้ - Annual Meeting 2025",
      owner: "SA Team",
      category: "invoice",
      eventOrCompany: "Annual Meeting 2025\nABC Corporation\n20 พ.ย.",
      description: "ใบแจ้งหนี้ค่าอุปกรณ์และบริการ",
      uploadedAt: "21 พ.ย. 2567",
      uploadedAtISO: "2024-11-21",
      sizeLabel: "2.4 MB",
    },
    {
      id: "DOC007",
      title: "ใบเสนอราคา - Product Launch Event",
      owner: "Manager Team",
      category: "quotation",
      eventOrCompany:
        "Product Launch Event\nTech Innovations Ltd\n25 พ.ย.",
      description: "ใบเสนอราคาอุปกรณ์เวทีและระบบแสง",
      uploadedAt: "18 พ.ย. 2567",
      uploadedAtISO: "2024-11-18",
      sizeLabel: "5.2 MB",
    },
    {
      id: "DOC008",
      title: "เอกสารอื่นๆ - แนบรูปตัวอย่างงาน",
      owner: "Manager Team",
      category: "other",
      eventOrCompany: "-",
      description: "ไฟล์แนบสำหรับอ้างอิงงานและตัวอย่างการติดตั้ง",
      uploadedAt: "2 ก.พ. 2567",
      uploadedAtISO: "2024-02-02",
      sizeLabel: "12 MB",
    },
  ]);

  const finance: FinanceSummary = useMemo(() => {
    const approvedEvents = eventReportRows.filter(
      (e) => e.status.tone === "success"
    );
    const totalRevenue = approvedEvents.reduce((sum, e) => sum + e.revenue, 0);
    const totalEvents = approvedEvents.length;
    const avgPerEvent =
      totalEvents > 0 ? Math.round(totalRevenue / totalEvents) : 0;
    const topEvents = [...approvedEvents]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((e) => ({ id: e.id, name: e.title, amount: e.revenue }));
    return { totalRevenue, totalEvents, avgPerEvent, topEvents };
  }, [eventReportRows]);

  const stockRows = useMemo(() => mapStockRows(stockData), [stockData]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("failed to fetch events");
        const rows = (await res.json()) as Array<{
          id: string;
          title: string;
          company: string;
          date: string;
          isDamaged?: boolean;
          items: string;
          status: {
            text: string;
            tone: "success" | "pending" | "progress" | "rejected";
          };
          equipment?: Array<{ qty: number; pricePerDayTHB: number }>;
        }>;
        setEventReportRows(
          rows.map((r) => {
            const days = daysBetween(r.date);
            const revenue = Array.isArray(r.equipment)
              ? r.equipment.reduce(
                  (sum, eq) => sum + eq.qty * eq.pricePerDayTHB * days,
                  0
                )
              : 0;
            return {
              id: r.id,
              title: r.title,
              company: r.company,
              date: r.date,
              revenue,
              isDamaged: r.isDamaged === true,
              equipmentCount: Array.isArray(r.equipment)
                ? r.equipment.length
                : 0,
              status: {
                text: r.status.text,
                tone: r.status.tone === "success" ? "success" : "pending",
              },
            };
          })
        );
      } catch {
        setEventReportRows([]);
      }
    };
    loadEvents();
  }, []);

  const damageRows = useMemo<DamageRow[]>(() => {
    // Per-item rows from return flow take priority; exclude event-level rows for those events
    const extraEventIds = new Set(
      (extraDamageRows ?? []).map((r) => r.eventId).filter(Boolean)
    );
    const apiRows = eventReportRows
      .filter((e) => e.isDamaged && !extraEventIds.has(e.id))
      .map((e) => ({
        id: e.id,
        itemName: e.title,
        code: `#${e.id}`,
        eventId: e.id,
        date: e.date,
        cost: e.revenue,
        status: "reported" as const,
      }));
    return [...(extraDamageRows ?? []), ...apiRows];
  }, [eventReportRows, extraDamageRows]);

  const filteredStock = useMemo(
    () => filterStockRows(stockRows, query),
    [stockRows, query]
  );

  const filteredEvents = useMemo(
    () => filterEventRows(eventReportRows, query),
    [eventReportRows, query]
  );

  const filteredDamage = useMemo(
    () => filterDamageRows(damageRows, query),
    [damageRows, query]
  );

  const filteredDocs = useMemo(
    () => filterDocsRows(docsRows, query, docCategory, docSort),
    [docsRows, query, docCategory, docSort]
  );

  const docStats = useMemo(() => getDocStats(docsRows), [docsRows]);
  const searchPlaceholder = useMemo(() => getSearchPlaceholder(tab), [tab]);

  const handleExportStock = () => {
    exportToExcel(
      "Stock Report",
      "stock-report",
      buildStockExportData(filteredStock)
    );
  };

  const handleExportEvents = () => {
    exportToExcel(
      "Events Report",
      "events-report",
      buildEventsExportData(filteredEvents)
    );
  };

  const handleExportDocs = () => {
    exportToExcel(
      "Documents",
      "documents-report",
      buildDocsExportData(filteredDocs)
    );
  };

  const handleExportFinance = () => {
    alert("ยังไม่มีข้อมูลการเงินให้ส่งออก");
  };

  const handleExportDamage = () => {
    if (filteredDamage.length === 0) {
      alert("ไม่มีรายการความเสียหายให้ส่งออก");
      return;
    }
    exportToExcel("Damage Report", "damage-report", buildDamageExportData(filteredDamage));
  };

  const onAddDoc = () => setIsAddDocOpen(true);

  const onViewDoc = (id: string) => {
    const doc = docsRows.find((r) => r.id === id);
    if (doc) setSelectedDoc(doc);
  };

  const onDownloadDoc = (id: string) => {
    alert(`ดาวน์โหลด: ${id}`);
  };

  const onDeleteDoc = (id: string) => {
    const doc = docsRows.find((d) => d.id === id);
    if (doc) setDeleteDoc(doc);
  };

  const handleConfirmDeleteDoc = () => {
    if (!deleteDoc) return;
    setDocsRows((prev) => prev.filter((d) => d.id !== deleteDoc.id));
    setDeleteDoc(null);
  };

  const onOpenInvoice = (id: string) => {
    alert(`ใบแจ้งหนี้: ${id}`);
  };

  const onOpenQuotation = (id: string) => {
    alert(`ใบเสนอราคา: ${id}`);
  };

  const onOpenWorkOrder = (id: string) => {
    alert(`ใบสั่งงาน: ${id}`);
  };

  return (
    <div className="px-6 py-8">
      <ReportsHeader />

      <ReportsTabs tab={tab} onChange={setTab} role={role} />

      {tab === "docs" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ReportsSummaryCard
            icon={<FileText className="h-5 w-5" />}
            value={docStats.total}
            label="ทั้งหมด"
            tone="blue"
          />
          <ReportsSummaryCard
            icon={<FileText className="h-5 w-5" />}
            value={docStats.invoice}
            label="ใบแจ้งหนี้"
            tone="emerald"
          />
          <ReportsSummaryCard
            icon={<FileText className="h-5 w-5" />}
            value={docStats.quotation}
            label="ใบเสนอราคา"
            tone="blue"
          />
          <ReportsSummaryCard
            icon={<FileText className="h-5 w-5" />}
            value={docStats.workorder}
            label="ใบสั่งงาน"
            tone="violet"
          />
          <ReportsSummaryCard
            icon={<FileText className="h-5 w-5" />}
            value={docStats.other}
            label="อื่นๆ"
            tone="orange"
          />
        </div>
      )}

      <ReportsSearchBar
        tab={tab}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={searchPlaceholder}
        docCategory={docCategory}
        onDocCategoryChange={setDocCategory}
        docSort={docSort}
        onDocSortChange={setDocSort}
      />

      <div className="mt-6">
        {tab === "finance" && (
          <FinanceReportSection
            finance={finance}
            onExport={handleExportFinance}
          />
        )}
        {tab === "stock" && (
          <StockReportSection
            rows={filteredStock}
            totalRows={stockRows.length}
            onExport={handleExportStock}
          />
        )}
        {tab === "events" && (
          <EventsReportSection
            rows={filteredEvents}
            totalRows={eventReportRows.length}
            onExport={handleExportEvents}
            onOpenInvoice={onOpenInvoice}
            onOpenQuotation={onOpenQuotation}
            onOpenWorkOrder={onOpenWorkOrder}
          />
        )}
        {tab === "damage" && (
          <DamageReportSection
            rows={filteredDamage}
            onExport={handleExportDamage}
          />
        )}
        {tab === "docs" && (
          <DocsReportSection
            role={role}
            rows={filteredDocs}
            totalRows={docsRows.length}
            onExport={handleExportDocs}
            onAddDoc={onAddDoc}
            onViewDoc={onViewDoc}
            onDownloadDoc={onDownloadDoc}
            onDeleteDoc={onDeleteDoc}
          />
        )}
      </div>

      <div className="h-10" />

      <AddDocModal
        open={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        onConfirm={(doc) => setDocsRows((prev) => [doc, ...prev])}
      />

      <ReportDocDetailModal
        selectedDoc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <ConfirmDeleteDocModal
        open={deleteDoc !== null}
        docName={deleteDoc?.title ?? ""}
        onConfirm={handleConfirmDeleteDoc}
        onCancel={() => setDeleteDoc(null)}
      />
    </div>
  );
}