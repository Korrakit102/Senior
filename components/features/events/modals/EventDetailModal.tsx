"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Building2,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  MapPin,
  Phone,
  Upload,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { EventItem, Role, SelectedEquipment } from "../types";
import { formatTHB, fmtDateRangeThai, parseDateRange, toDateLocal } from "../helpers";
import EventStatusPill from "../components/EventStatusPill";
import ConfirmUploadReceiptModal from "./ConfirmUploadReceiptModal";
import ConfirmPaymentApprovalModal from "./ConfirmPaymentApprovalModal";

export default function EventDetailModal({
  open,
  event,
  equipment,
  role,
  onClose,
  onUploadReceipt,
  onConfirmPayment,
}: {
  open: boolean;
  event: EventItem | null;
  equipment: SelectedEquipment[];
  role: Role;
  onClose: () => void;
  onUploadReceipt: (eventId: string, file: File) => Promise<void>;
  onConfirmPayment: (eventId: string) => Promise<void>;
}) {
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [pendingReceiptFile, setPendingReceiptFile] = useState<File | null>(null);
  const [pendingReceiptPreviewUrl, setPendingReceiptPreviewUrl] = useState<string | null>(null);
  const [isConfirmPaymentModalOpen, setIsConfirmPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setIsUploadingReceipt(false);
      setIsConfirmingPayment(false);
      setPendingReceiptFile(null);
      setIsConfirmPaymentModalOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!pendingReceiptFile) {
      setPendingReceiptPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingReceiptFile);
    setPendingReceiptPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingReceiptFile]);

  if (!open || !event) return null;

  const { startStr, endStr } = parseDateRange(event.date);

  const startDateRaw = startStr ? toDateLocal(startStr) : null;
  const endDateRaw = endStr ? toDateLocal(endStr) : null;

  const startDate =
    startDateRaw && !Number.isNaN(startDateRaw.getTime())
      ? startDateRaw
      : null;

  const endDate =
    endDateRaw && !Number.isNaN(endDateRaw.getTime())
      ? endDateRaw
      : null;

  const eventDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  const totalQty = equipment.reduce((sum, it) => sum + it.qty, 0);
  const uniqueTypes = new Set(equipment.map((x) => x.name)).size;
  const totalCostPerDay = equipment.reduce(
    (sum, it) => sum + it.qty * it.pricePerDayTHB,
    0
  );
  const totalCost =
    eventDays > 0 ? totalCostPerDay * eventDays : totalCostPerDay;

  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

  const dateRangeLabel =
    startDate && endDate ? `${fmtDate(startDate)} - ${fmtDate(endDate)}` : fmtDateRangeThai(event.date);

  const canUploadReceipt =
    role === "SA" &&
    (event.status.text === "รอชำระเงิน" ||
      event.status.text === "รอตรวจสอบการชำระเงิน");

  const canConfirmPayment =
    role === "Manager" &&
    event.status.text === "รอตรวจสอบการชำระเงิน" &&
    Boolean(event.paymentReceipt);
  const shouldShowPaymentSection =
    canUploadReceipt ||
    Boolean(event.paymentReceipt) ||
    event.status.text === "รอชำระเงิน" ||
    event.status.text === "รอตรวจสอบการชำระเงิน";

  const handleReceiptFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      await onUploadReceipt(event.id, file);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleConfirmUploadReceipt = async () => {
    if (!pendingReceiptFile) return;
    await handleReceiptFile(pendingReceiptFile);
    setPendingReceiptFile(null);
  };

  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      await onConfirmPayment(event.id);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleConfirmPaymentApproval = async () => {
    await handleConfirmPayment();
    setIsConfirmPaymentModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-zinc-900">รายละเอียดอีเวนต์</div>
              <div className="mt-1 text-sm text-zinc-500">ข้อมูลพื้นฐานของอีเวนต์</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="truncate text-xl font-semibold text-zinc-900">
                  {event.title}
                </div>
                <EventStatusPill tone={event.status.tone} text={event.status.text} />
                <span className="text-sm text-zinc-500">{event.code}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-5 pb-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <Wallet className="h-4 w-4 text-red-500" />
                  งบประมาณ
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {event.budgetTHB != null ? `${formatTHB(event.budgetTHB)} บาท` : "-"}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                  ค่าอุปกรณ์ต่อวัน
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {totalCostPerDay > 0 ? `${formatTHB(totalCostPerDay)} บาท/วัน` : "-"}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <CalendarRange className="h-4 w-4 text-emerald-500" />
                  จำนวนวันจัดงาน
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {eventDays ? `${eventDays} วัน` : "-"}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <Users className="h-4 w-4 text-violet-500" />
                  ผู้เข้าร่วม
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {event.attendees != null
                    ? new Intl.NumberFormat("th-TH").format(event.attendees)
                    : "-"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Building2 className="h-4 w-4" />
                  บริษัท
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {event.company || "-"}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <User className="h-4 w-4" />
                  ชื่อลูกค้า
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {event.organizer || "-"}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <User className="h-4 w-4" />
                  ชื่อผู้ติดต่อ
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {event.contactName || "-"}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Phone className="h-4 w-4" />
                  เบอร์โทรผู้ติดต่อ
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {event.contactPhone || "-"}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <ClipboardList className="h-4 w-4" />
                  สถานะ
                </div>
                <div className="mt-1">
                  <EventStatusPill tone={event.status.tone} text={event.status.text} />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  สถานที่
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {event.place || "-"}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <CalendarRange className="h-4 w-4" />
                  วันจัดงาน
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {dateRangeLabel}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Archive className="h-4 w-4" />
                  รหัสสาขา
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {event.branchCode || "-"}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <ClipboardList className="h-4 w-4" />
                คำอธิบาย
              </div>
              <div className="mt-2 text-sm text-zinc-700">{event.desc || "-"}</div>
            </div>

            {shouldShowPaymentSection && (
              <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      การชำระเงิน
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      ลูกค้าแนบสลิปการชำระเงิน หลังจากคืนอุปกรณ์ครบแล้ว
                    </div>
                  </div>

                  {canUploadReceipt && (
                    <>
                      <input
                        ref={receiptInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setPendingReceiptFile(file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => receiptInputRef.current?.click()}
                        disabled={isUploadingReceipt}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingReceipt ? "กำลังแนบ..." : "แนบสลิปการชำระเงิน"}
                      </button>
                    </>
                  )}
                </div>

                {event.paymentReceipt ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-emerald-800">
                          แนบสลิปแล้ว
                        </div>
                        <div className="mt-1 truncate text-xs text-emerald-700">
                          {event.paymentReceipt.fileName}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={event.paymentReceipt.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          เปิดดูสลิป
                        </a>

                        {canConfirmPayment && (
                          <button
                            type="button"
                            onClick={() => setIsConfirmPaymentModalOpen(true)}
                            disabled={isConfirmingPayment}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {isConfirmingPayment ? "กำลังยืนยัน..." : "ยืนยันการชำระเงิน"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500">
                    {role === "SA"
                      ? "ยังไม่ได้แนบสลิปการชำระเงิน กรุณาแนบหลังชำระเงิน"
                      : "ยังไม่มีสลิปจากลูกค้า"}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
                อุปกรณ์ {equipment.length} รายการ
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                รวม {totalQty} ชิ้น / {uniqueTypes} ประเภท
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                รวมค่าใช้จ่าย {totalCost > 0 ? `${formatTHB(totalCost)} บาท` : "-"}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {equipment.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
                  ยังไม่มีอุปกรณ์ที่เลือก
                </div>
              ) : (
                equipment.map((item, idx) => {
                  const enough = item.available >= item.qty;
                  const totalPerItem = item.pricePerDayTHB * item.qty * (eventDays || 1);

                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">{item.category}</div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            enough
                              ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {enough ? "พอ" : "ไม่พอ"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                        <div>
                          <div className="text-xs text-zinc-400">จำนวนที่ต้องใช้</div>
                          <div className="mt-1 font-semibold text-zinc-900">{item.qty} ชิ้น</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400">จำนวนที่มีอยู่</div>
                          <div className="mt-1 font-semibold text-zinc-900">
                            {item.available} ชิ้น
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400">ค่าบริการ/วัน</div>
                          <div className="mt-1 font-semibold text-zinc-900">
                            {formatTHB(item.pricePerDayTHB)} บาท
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400">จำนวนวัน</div>
                          <div className="mt-1 font-semibold text-zinc-900">
                            {eventDays || 1} วัน
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400">รวมค่าใช้จ่าย</div>
                          <div className="mt-1 font-semibold text-red-600">
                            {formatTHB(totalPerItem)} บาท
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmUploadReceiptModal
        open={Boolean(pendingReceiptFile)}
        fileName={pendingReceiptFile?.name ?? ""}
        previewUrl={pendingReceiptPreviewUrl}
        isSubmitting={isUploadingReceipt}
        onConfirm={() => void handleConfirmUploadReceipt()}
        onCancel={() => setPendingReceiptFile(null)}
      />

      <ConfirmPaymentApprovalModal
        open={isConfirmPaymentModalOpen}
        isSubmitting={isConfirmingPayment}
        onConfirm={() => void handleConfirmPaymentApproval()}
        onCancel={() => setIsConfirmPaymentModalOpen(false)}
      />
    </div>
  );
}
