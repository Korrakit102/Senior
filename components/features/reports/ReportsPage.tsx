"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Role } from "../../AppShell";
import type {
  AppStock,
  DamageRow,
  DocCategory,
  DocRow,
  EventReportRow,
  EventStatusFilter,
  FinanceSummary,
  ReportTab,
  WorkOrderSalesTargets,
} from "./types";
import {
  buildDamageExportData,
  buildDocsExportData,
  buildEventsExportData,
  buildFinanceExportData,
  buildStockExportData,
  exportToExcel,
  filterDamageRows,
  filterDocsRows,
  filterEventRows,
  filterStockRows,
  getSearchPlaceholder,
  mapStockRows,
} from "./helpers";

import ReportsHeader from "./components/ReportsHeader";
import ReportsTabs from "./components/ReportsTabs";
import ReportsSearchBar from "./components/ReportsSearchBar";

import FinanceReportSection from "./components/FinanceReportSection";
import StockReportSection from "./components/StockReportSection";
import EventsReportSection from "./components/EventsReportSection";
import DamageReportSection from "./components/DamageReportSection";
import DocsReportSection from "./components/DocsReportSection";

import ReportDocDetailModal from "./modals/ReportDocDetailModal";
import ConfirmDeleteDocModal from "./modals/ConfirmDeleteDocModal";
import AddDocModal from "./modals/AddDocModal";
import QuotationInvoiceModal from "./modals/QuotationInvoiceModal";
import WorkOrderModal from "./modals/WorkOrderModal";
import DamageInvoiceModal from "./modals/DamageInvoiceModal";
import EditDamageAmountModal from "./modals/EditDamageAmountModal";

function daysBetween(range: string): number {
  const parts = range.split(" - ");
  if (parts.length < 2) return 1;

  const startDate = new Date(parts[0].trim());
  const endDate = new Date(parts[1].trim());
  if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
    return Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
    );
  }

  const a = parts[0].trim().split("-").map(Number);
  const b = parts[1].trim().split("-").map(Number);
  if (a.length < 3 || b.length < 3 || !a[0] || !b[0]) return 1;
  const s = Date.UTC(a[0], a[1] - 1, a[2]);
  const e = Date.UTC(b[0], b[1] - 1, b[2]);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

function formatDocDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDocDateISO(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

function formatShortDate(value: string, withYear: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" as const } : {}),
  });
}

function formatEventDateRange(range: string) {
  const [startRaw, endRaw] = range.split(" - ").map((part) => part.trim());
  if (!startRaw || !endRaw) return range;

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return range;
  }

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) return formatShortDate(endRaw, true);

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startText = formatShortDate(startRaw, !sameYear);
  const endText = formatShortDate(endRaw, true);
  return `${startText} - ${endText}`;
}

type Props = {
  role: Role;
  stockData: AppStock[];
  extraDamageRows?: DamageRow[];
};

export default function ReportsPage({ role, stockData, extraDamageRows }: Props) {
  const canIssueDamageInvoice = role !== "Stockkeeper";
  const [tab, setTab] = useState<ReportTab>(
    role === "Stockkeeper" ? "stock" : "finance"
  );
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocRow | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocRow | null>(null);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docCategory, setDocCategory] = useState<"all" | DocCategory>("all");
  const [docSort, setDocSort] = useState<"newest" | "oldest">("newest");
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatusFilter>("all");
  const [eventReportRows, setEventReportRows] = useState<EventReportRow[]>([]);
  const [persistedDamageRows, setPersistedDamageRows] = useState<DamageRow[]>([]);
  const [invoiceEvent, setInvoiceEvent] = useState<EventReportRow | null>(null);
  const [quotationEvent, setQuotationEvent] = useState<EventReportRow | null>(null);
  const [workOrderEvent, setWorkOrderEvent] = useState<EventReportRow | null>(null);
  const [damageInvoiceRow, setDamageInvoiceRow] = useState<DamageRow | null>(null);
  const [editDamageRow, setEditDamageRow] = useState<DamageRow | null>(null);
  const [damageAmountOverrides, setDamageAmountOverrides] = useState<
    Record<string, { cost: number; billedCost: number }>
  >({});
  const [hiddenEventDocIds, setHiddenEventDocIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    if (!canIssueDamageInvoice) {
      setDamageInvoiceRow(null);
      setEditDamageRow(null);
    }
  }, [canIssueDamageInvoice]);

  const [docsRows, setDocsRows] = useState<DocRow[]>([
    {
      id: "DOC001",
      title: "ใบสั่งงาน - งานเลี้ยงปีใหม่",
      owner: "ทีมเจ้าหน้าที่คลัง",
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
      owner: "ทีมเจ้าหน้าที่คลัง",
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
      owner: "ทีมผู้จัดการ",
      category: "contract",
      eventOrCompany:
        "โครงการพัฒนาพนักงาน\nบริษัท เอชอาร์ โซลูชันส์ จำกัด\n1 ต.ค. - 31 ธ.ค.",
      description: "สัญญาเช่าอุปกรณ์สำหรับงานต่อเนื่อง 6 เดือน",
      uploadedAt: "1 มี.ค. 2567",
      uploadedAtISO: "2024-03-01",
      sizeLabel: "3.5 MB",
    },
    {
      id: "DOC004",
      title: "ใบเสนอราคา - งานแสดงสินค้านานาชาติ",
      owner: "ทีมผู้จัดการ",
      category: "quotation",
      eventOrCompany:
        "งานแสดงสินค้านานาชาติ 2024\nบริษัท เทคอินโนเวชั่นส์ จำกัด\n5 ก.ค. - 8 ก.ค.",
      description: "ใบเสนอราคาอุปกรณ์สำหรับงานแสดงสินค้านานาชาติ",
      uploadedAt: "15 พ.ค. 2567",
      uploadedAtISO: "2024-05-15",
      sizeLabel: "4.8 MB",
    },
    {
      id: "DOC005",
      title: "ใบแจ้งหนี้ - งานสัมมนาผู้บริหาร",
      owner: "ทีมลูกค้า",
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
      title: "ใบแจ้งหนี้ - ประชุมประจำปี 2025",
      owner: "ทีมลูกค้า",
      category: "invoice",
      eventOrCompany: "ประชุมประจำปี 2025\nบริษัท เอบีซี จำกัด\n20 พ.ย.",
      description: "ใบแจ้งหนี้ค่าอุปกรณ์และบริการ",
      uploadedAt: "21 พ.ย. 2567",
      uploadedAtISO: "2024-11-21",
      sizeLabel: "2.4 MB",
    },
    {
      id: "DOC007",
      title: "ใบเสนอราคา - งานเปิดตัวสินค้า",
      owner: "ทีมผู้จัดการ",
      category: "quotation",
      eventOrCompany:
        "งานเปิดตัวสินค้า\nบริษัท เทค อินโนเวชั่นส์ จำกัด\n25 พ.ย.",
      description: "ใบเสนอราคาอุปกรณ์เวทีและระบบแสง",
      uploadedAt: "18 พ.ย. 2567",
      uploadedAtISO: "2024-11-18",
      sizeLabel: "5.2 MB",
    },
    {
      id: "DOC008",
      title: "เอกสารอื่นๆ - แนบรูปตัวอย่างงาน",
      owner: "ทีมผู้จัดการ",
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
          place: string;
          date: string;
          isDamaged?: boolean;
          items: string;
          organizer?: string;
          contactName?: string;
          contactPhone?: string;
          customerEmail?: string;
          customerTaxId?: string;
          branchCode?: string;
          budgetTHB?: number;
          attendees?: number;
          workFormat?: string;
          workNature?: string;
          eventSize?: string;
          eventType?: string;
          desc?: string;
          workOrderSalesTargets?: WorkOrderSalesTargets;
          status: {
            text: string;
            tone: "success" | "pending" | "progress" | "rejected";
          };
          paymentReceipt?: {
            fileName: string;
            fileType: string;
            dataUrl: string;
            uploadedAt: string;
          };
          equipment?: Array<{ name: string; qty: number; category: string; pricePerDayTHB: number }>;
        }>;
        setEventReportRows(
          rows.map((r) => {
            const parts = r.date.split(" - ");
            const startDate = parts[0]?.trim() ?? "";
            const endDate = parts[1]?.trim() ?? "";
            const days = daysBetween(r.date);
            const equipment = Array.isArray(r.equipment) ? r.equipment : [];
            const revenue = equipment.reduce(
              (sum, eq) => sum + eq.qty * eq.pricePerDayTHB * days, 0
            );
            return {
              id: r.id,
              title: r.title,
              company: r.company,
              place: r.place ?? "",
              date: r.date,
              startDate,
              endDate,
              revenue,
              isDamaged: r.isDamaged === true,
              equipmentCount: equipment.length,
              organizer: r.organizer,
              contactName: r.contactName,
              contactPhone: r.contactPhone,
              customerEmail: r.customerEmail,
              customerTaxId: r.customerTaxId,
              branchCode: r.branchCode,
              budgetTHB: r.budgetTHB,
              attendees: r.attendees,
              workFormat: r.workFormat,
              workNature: r.workNature,
              eventSize: r.eventSize,
              eventType: r.eventType,
              description: r.desc,
              equipment,
              workOrderSalesTargets: r.workOrderSalesTargets,
              paymentReceipt: r.paymentReceipt,
              status: {
                text: r.status.text,
                tone: (r.status.tone === "success" || r.status.tone === "progress") ? "success" : "pending",
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

  useEffect(() => {
    const loadDamageItems = async () => {
      try {
        const res = await fetch("/api/damage-items");
        if (!res.ok) throw new Error("failed to fetch damage items");
        const rows = (await res.json()) as DamageRow[];
        setPersistedDamageRows(rows);
      } catch {
        setPersistedDamageRows([]);
      }
    };
    loadDamageItems();
  }, []);

  const handleWorkOrderSalesTargetsSaved = (
    eventId: string,
    workOrderSalesTargets: WorkOrderSalesTargets
  ) => {
    setEventReportRows((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, workOrderSalesTargets } : event
      )
    );
    setWorkOrderEvent((current) =>
      current?.id === eventId ? { ...current, workOrderSalesTargets } : current
    );
  };

  const eventDocumentRows = useMemo<DocRow[]>(
    () =>
      eventReportRows
        .filter((event) => event.status.text === "เสร็จสิ้น" && event.paymentReceipt)
        .map((event) => {
          const receipt = event.paymentReceipt;
          const uploadedAtISO = toDocDateISO(receipt?.uploadedAt ?? "");
          const id = `EVT-${event.id}-RECEIPT`;

          const doc: DocRow = {
            id,
            title: `ใบเสร็จ - ${event.title}`,
            owner: "ทีมลูกค้า",
            category: "receipt",
            eventOrCompany: `${event.title}\n${event.company}\n${formatEventDateRange(event.date)}`,
            description: "ใบเสร็จที่ลูกค้าแนบและผู้จัดการยืนยันการชำระเงินแล้ว",
            uploadedAt: formatDocDate(receipt?.uploadedAt ?? ""),
            uploadedAtISO,
            sizeLabel: receipt?.fileType || "ไฟล์แนบ",
            fileName: receipt?.fileName,
            fileUrl: receipt?.dataUrl,
            source: "event",
          };

          return doc;
        })
        .filter((doc) => !hiddenEventDocIds.has(doc.id)),
    [eventReportRows, hiddenEventDocIds]
  );

  const allDocsRows = useMemo(
    () => [...eventDocumentRows, ...docsRows],
    [eventDocumentRows, docsRows]
  );

  const damageRows = useMemo<DamageRow[]>(() => {
    // ลำดับความสำคัญ: persisted row จาก DB (มีข้อมูลจริงรวมรูปหลักฐาน) > row ในเซสชันปัจจุบัน (instant feedback ก่อนอัปโหลดเสร็จ) > fallback ระดับอีเวนต์ (ไม่มี breakdown จริง)
    // match กันด้วย eventId + itemName (ไม่ใช้ id เพราะ row ในเซสชันปัจจุบันสร้าง id ฝั่ง client ที่ไม่ตรงกับ id จริงใน DB)
    const rowKey = (r: DamageRow) => `${r.eventId ?? ""}::${r.itemName.trim().toLowerCase()}`;
    const persistedByKey = new Map(persistedDamageRows.map((r) => [rowKey(r), r] as const));

    // แทนที่ row ชั่วคราวด้วย row จาก DB ทันทีที่อัปโหลดเสร็จ (จะได้ photoPaths/id จริง) โดยไม่ทิ้งข้อมูลที่ยังอัปโหลดไม่เสร็จ
    const mergedExtraRows: DamageRow[] = (extraDamageRows ?? []).map(
      (r) => persistedByKey.get(rowKey(r)) ?? r
    );
    const usedPersistedKeys = new Set(mergedExtraRows.map(rowKey));

    const extraEventIds = new Set(
      (extraDamageRows ?? []).map((r) => r.eventId).filter(Boolean)
    );
    const persistedForOtherEvents = persistedDamageRows.filter(
      (r) => !usedPersistedKeys.has(rowKey(r))
    );
    const coveredEventIds = new Set([
      ...extraEventIds,
      ...persistedForOtherEvents.map((r) => r.eventId).filter(Boolean),
    ]);
    const apiRows: DamageRow[] = eventReportRows
      .filter((e) => e.isDamaged && !coveredEventIds.has(e.id))
      .map((e) => ({
        id: e.id,
        itemName: `ความเสียหาย — ${e.title}`,
        code: `#${e.id}`,
        eventId: e.id,
        date: e.date,
        cost: 0,
        status: "reported" as const,
      }));
    // ซ่อนแถว fallback ที่ไม่มี breakdown รายชิ้นจริง (qty ไม่มีค่า และมูลค่า = 0) ออกจากรายงาน
    return [...mergedExtraRows, ...persistedForOtherEvents, ...apiRows].filter(
      (r) => r.qty != null && r.cost > 0
    );
  }, [eventReportRows, extraDamageRows, persistedDamageRows]);

  // ทับค่า cost/billedCost ด้วยค่าที่แก้ไขล่าสุดในเซสชันนี้ (ครอบคลุมทั้งแถวที่มาจาก DB และแถว optimistic ที่ยังไม่มี id ตรงกับ DB)
  const displayedDamageRows = useMemo<DamageRow[]>(
    () =>
      damageRows.map((r) =>
        damageAmountOverrides[r.id]
          ? { ...r, cost: damageAmountOverrides[r.id].cost, billedCost: damageAmountOverrides[r.id].billedCost }
          : r
      ),
    [damageRows, damageAmountOverrides]
  );

  const filteredStock = useMemo(
    () => filterStockRows(stockRows, query),
    [stockRows, query]
  );

  const filteredEvents = useMemo(
    () => filterEventRows(eventReportRows, query, eventStatusFilter),
    [eventReportRows, query, eventStatusFilter]
  );

  const filteredDamage = useMemo(
    () => filterDamageRows(displayedDamageRows, query),
    [displayedDamageRows, query]
  );

  const filteredDocs = useMemo(
    () => filterDocsRows(allDocsRows, query, docCategory, docSort),
    [allDocsRows, query, docCategory, docSort]
  );

  const searchPlaceholder = useMemo(() => getSearchPlaceholder(tab), [tab]);

  const handleExportStock = () => {
    exportToExcel(
      "รายงานสต็อก",
      "stock-report",
      buildStockExportData(filteredStock)
    );
  };

  const handleExportEvents = () => {
    exportToExcel(
      "รายงานอีเวนต์",
      "events-report",
      buildEventsExportData(filteredEvents)
    );
  };

  const handleExportDocs = () => {
    exportToExcel(
      "เอกสาร",
      "documents-report",
      buildDocsExportData(filteredDocs)
    );
  };

  const handleExportFinance = () => {
    exportToExcel(
      "รายงานการเงิน",
      "finance-report",
      buildFinanceExportData(finance, eventReportRows)
    );
  };

  const handleExportDamage = () => {
    if (filteredDamage.length === 0) {
      alert("ไม่มีรายการความเสียหายให้ส่งออก");
      return;
    }
    exportToExcel("รายงานความเสียหาย", "damage-report", buildDamageExportData(filteredDamage));
  };

  const onAddDoc = () => setIsAddDocOpen(true);

  const onViewDoc = (id: string) => {
    const doc = allDocsRows.find((r) => r.id === id);
    if (doc) setSelectedDoc(doc);
  };

  const onDownloadDoc = (id: string) => {
    const doc = allDocsRows.find((r) => r.id === id);
    if (!doc) return;

    if (!doc.fileUrl) {
      alert(`ดาวน์โหลด: ${id}`);
      return;
    }

    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName ?? doc.title;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onDeleteDoc = (id: string) => {
    const doc = allDocsRows.find((d) => d.id === id);
    if (doc) setDeleteDoc(doc);
  };

  const handleConfirmDeleteDoc = () => {
    if (!deleteDoc) return;
    if (deleteDoc.source === "event") {
      setHiddenEventDocIds((prev) => {
        const next = new Set(prev);
        next.add(deleteDoc.id);
        return next;
      });
    } else {
      setDocsRows((prev) => prev.filter((d) => d.id !== deleteDoc.id));
    }
    if (selectedDoc?.id === deleteDoc.id) setSelectedDoc(null);
    setDeleteDoc(null);
  };

  const canOpenEventDocument = (
    event: EventReportRow | undefined
  ): event is EventReportRow =>
    event !== undefined && event.status.text !== "รออนุมัติ";

  const onOpenInvoice = (id: string) => {
    const event = eventReportRows.find((r) => r.id === id);
    if (!canOpenEventDocument(event)) return;
    setInvoiceEvent(event);
  };

  const onOpenQuotation = (id: string) => {
    const event = eventReportRows.find((r) => r.id === id);
    if (!canOpenEventDocument(event)) return;
    setQuotationEvent(event);
  };

  const onOpenWorkOrder = (id: string) => {
    const event = eventReportRows.find((r) => r.id === id);
    if (!canOpenEventDocument(event)) return;
    setWorkOrderEvent(event);
  };

  const onOpenDamageInvoice = (row: DamageRow) => {
    if (!canIssueDamageInvoice) return;
    setDamageInvoiceRow(row);
  };

  const damageInvoiceEvent = damageInvoiceRow
    ? eventReportRows.find((r) => r.id === damageInvoiceRow.eventId) ?? null
    : null;

  const onOpenDamageEdit = (row: DamageRow) => {
    if (!canIssueDamageInvoice) return;
    setEditDamageRow(row);
  };

  const onSaveDamageEdit = async (payload: { cost: number; billedCost: number }) => {
    if (!editDamageRow) return;

    try {
      const res = await fetch(`/api/damage-items/${editDamageRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: editDamageRow.eventId ?? "",
          itemName: editDamageRow.itemName,
          cost: payload.cost,
          billedCost: payload.billedCost,
        }),
      });
      if (!res.ok) throw new Error("failed to update damage amounts");

      setDamageAmountOverrides((prev) => ({
        ...prev,
        [editDamageRow.id]: { cost: payload.cost, billedCost: payload.billedCost },
      }));
      setDamageInvoiceRow((prev) =>
        prev && prev.id === editDamageRow.id
          ? { ...prev, cost: payload.cost, billedCost: payload.billedCost }
          : prev
      );
      setEditDamageRow(null);
    } catch {
      alert("บันทึกมูลค่าความเสียหายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="px-6 py-8">
      <ReportsHeader />

      <ReportsTabs tab={tab} onChange={setTab} role={role} />

      <ReportsSearchBar
        tab={tab}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={searchPlaceholder}
        eventStatusFilter={eventStatusFilter}
        onEventStatusFilterChange={setEventStatusFilter}
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
            onOpenInvoice={onOpenDamageInvoice}
            canIssueInvoice={canIssueDamageInvoice}
          />
        )}
        {tab === "docs" && (
          <DocsReportSection
            role={role}
            rows={filteredDocs}
            totalRows={allDocsRows.length}
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

      <QuotationInvoiceModal
        open={invoiceEvent !== null}
        docType="invoice"
        event={invoiceEvent}
        onClose={() => setInvoiceEvent(null)}
      />

      <QuotationInvoiceModal
        open={quotationEvent !== null}
        docType="quotation"
        event={quotationEvent}
        onClose={() => setQuotationEvent(null)}
      />

      <WorkOrderModal
        open={workOrderEvent !== null}
        event={workOrderEvent}
        onClose={() => setWorkOrderEvent(null)}
        onSaved={handleWorkOrderSalesTargetsSaved}
      />

      <DamageInvoiceModal
        open={canIssueDamageInvoice && damageInvoiceRow !== null}
        damageRow={damageInvoiceRow}
        event={damageInvoiceEvent}
        onClose={() => setDamageInvoiceRow(null)}
        onEdit={() => damageInvoiceRow && onOpenDamageEdit(damageInvoiceRow)}
      />

      <EditDamageAmountModal
        open={canIssueDamageInvoice && editDamageRow !== null}
        damageRow={editDamageRow}
        onClose={() => setEditDamageRow(null)}
        onSave={onSaveDamageEdit}
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
