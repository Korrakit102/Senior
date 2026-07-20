"use client";

import React from "react";
import type { DocRow } from "../types";
import ReportsCategoryPill from "../components/ReportsCategoryPill";

type Props = {
  selectedDoc: DocRow | null;
  onClose: () => void;
};

export default function ReportDocDetailModal({
  selectedDoc,
  onClose,
}: Props) {
  if (!selectedDoc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              รายละเอียดเอกสาร
            </div>
            <h3 className="mt-1 text-lg font-semibold text-zinc-900">
              {selectedDoc.title}
            </h3>
            <div className="mt-2 text-sm text-zinc-500">
              รหัสเอกสาร: {selectedDoc.id}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            ปิด
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">หมวดหมู่</div>
            <div className="mt-2">
              <ReportsCategoryPill cat={selectedDoc.category} />
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">
              ทีมผู้รับผิดชอบ
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-900">
              {selectedDoc.owner}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">
              วันที่อัปโหลด
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-900">
              {selectedDoc.uploadedAt}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">ขนาดไฟล์</div>
            <div className="mt-2 text-sm font-medium text-zinc-900">
              {selectedDoc.sizeLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-semibold text-zinc-500">
            อีเวนต์ / บริษัท
          </div>
          <div className="mt-2 whitespace-pre-line text-sm text-zinc-900">
            {selectedDoc.eventOrCompany}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-semibold text-zinc-500">คำอธิบาย</div>
          <div className="mt-2 text-sm text-zinc-900">
            {selectedDoc.description}
          </div>
        </div>
      </div>
    </div>
  );
}
