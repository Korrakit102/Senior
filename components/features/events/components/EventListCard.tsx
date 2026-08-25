import { useEffect, useRef, useState } from "react";
import { Eye, Package, Trash2, Lock, Upload, CheckCircle2, ExternalLink } from "lucide-react";
import EventStatusPill from "./EventStatusPill";
import ConfirmUploadReceiptModal from "../modals/ConfirmUploadReceiptModal";
import ConfirmPaymentApprovalModal from "../modals/ConfirmPaymentApprovalModal";
import type { EventItem, Role } from "../types";
import { fmtDateRangeThai } from "../helpers";

type EventListCardProps = {
  event: EventItem;
  role: Role;
  onOpenDetail: (eventId: string) => void;
  onManageItems: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onUploadReceipt: (eventId: string, file: File) => Promise<void>;
  onConfirmPayment: (eventId: string) => Promise<void>;
};

export default function EventListCard({
  event,
  role,
  onOpenDetail,
  onManageItems,
  onDelete,
  onUploadReceipt,
  onConfirmPayment,
}: EventListCardProps) {
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [pendingReceiptFile, setPendingReceiptFile] = useState<File | null>(null);
  const [pendingReceiptPreviewUrl, setPendingReceiptPreviewUrl] = useState<string | null>(null);
  const [isConfirmPaymentModalOpen, setIsConfirmPaymentModalOpen] = useState(false);
  // ✅ ล็อคปุ่มแก้ไขเมื่อ stockkeeper Issue ไปแล้ว
  const isLocked = event.isIssued === true;
  const canManageEquipment =
    role === "Manager" &&
    (event.status.text === "รออนุมัติ" || event.status.text === "อนุมัติแล้ว");
  const canDeleteEvent =
    role === "SA" &&
    !isLocked &&
    (event.status.text === "รออนุมัติ" || event.status.text === "ไม่อนุมัติ");

  const canUploadSlip =
    role === "SA" &&
    (event.status.text === "รอชำระเงิน" ||
      event.status.text === "รอตรวจสอบการชำระเงิน");
  const canConfirmPayment =
    role === "Manager" &&
    event.status.text === "รอตรวจสอบการชำระเงิน" &&
    Boolean(event.paymentReceipt);
  const shouldShowPaymentSection =
    canUploadSlip ||
    event.status.text === "รอชำระเงิน" ||
    event.status.text === "รอตรวจสอบการชำระเงิน";

  useEffect(() => {
    if (!pendingReceiptFile) {
      setPendingReceiptPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingReceiptFile);
    setPendingReceiptPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingReceiptFile]);

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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate text-base font-semibold text-zinc-900">
              {event.title}
            </h2>
            <EventStatusPill
              tone={event.status.tone}
              text={event.status.text}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="text-zinc-400">{event.code}</span>
            <span className="text-zinc-300">•</span>
            <span className="min-w-0 truncate">{event.desc || "-"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่มดูรายละเอียด */}
          <button
            className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-700 shadow-sm hover:bg-zinc-50"
            onClick={() => onOpenDetail(event.id)}
            title="ดูรายละเอียด"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* ✅ ปุ่มจัดการอุปกรณ์ */}
          {canManageEquipment && (
            isLocked ? (
              // ล็อคแล้ว - stockkeeper Issue ไปแล้ว
              <div
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-400 cursor-not-allowed"
                title="ไม่สามารถแก้ไขได้ เนื่องจาก stockkeeper เบิกอุปกรณ์ไปแล้ว"
              >
                <Lock className="h-4 w-4" />
                จัดการอุปกรณ์
              </div>
            ) : (
              // ยังแก้ไขได้
              <button
                onClick={() => onManageItems(event.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                title="จัดการอุปกรณ์"
              >
                <Package className="h-4 w-4" />
                จัดการอุปกรณ์
              </button>
            )
          )}

          {/* ปุ่มลบ - SA เห็น แต่ไม่แสดงเมื่ออุปกรณ์ถูกเบิกออกไปแล้ว */}
          {canDeleteEvent && (
            <button
              onClick={() => onDelete(event.id)}
              className="rounded-2xl border border-red-200 bg-white p-2.5 text-red-600 shadow-sm hover:bg-red-50"
              title="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-zinc-400">บริษัท</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{event.company}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">สถานที่</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{event.place}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">วันจัดงาน</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{fmtDateRangeThai(event.date)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">อุปกรณ์</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-900">
            {event.items}
            {/* ✅ badge เบิกแล้ว */}
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                <Lock className="h-3 w-3" />เบิกแล้ว
              </span>
            )}
          </div>
        </div>
      </div>

      {shouldShowPaymentSection && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
          {canUploadSlip && (
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
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {isUploadingReceipt ? "กำลังแนบ..." : "แนบสลิปการชำระเงิน"}
              </button>
            </>
          )}

          {event.paymentReceipt && (
            <a
              href={event.paymentReceipt.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              <ExternalLink className="h-4 w-4" />
              เปิดดูสลิป
            </a>
          )}

          {canConfirmPayment && (
            <button
              type="button"
              onClick={() => setIsConfirmPaymentModalOpen(true)}
              disabled={isConfirmingPayment}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isConfirmingPayment ? "กำลังยืนยัน..." : "ยืนยันการชำระเงิน"}
            </button>
          )}
        </div>
      )}

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
