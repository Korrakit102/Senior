import React, { useState } from "react";
import { X, FilePlus } from "lucide-react";
import type { DocCategory, DocRow } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (doc: DocRow) => void;
};

const categoryOptions: { value: DocCategory; label: string }[] = [
  { value: "invoice", label: "ใบแจ้งหนี้" },
  { value: "quotation", label: "ใบเสนอราคา" },
  { value: "workorder", label: "ใบสั่งงาน" },
  { value: "receipt", label: "ใบเสร็จ" },
  { value: "contract", label: "สัญญา" },
  { value: "report", label: "รายงาน" },
  { value: "other", label: "อื่นๆ" },
];

type SelectedFile = {
  name: string;
  type: string;
  dataUrl: string;
};

export default function AddDocModal({ open, onClose, onConfirm }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("invoice");
  const [eventOrCompany, setEventOrCompany] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  if (!open) return null;

  const handleFileChange = (file: File | undefined) => {
    if (!file) {
      setFileName("");
      setSelectedFile(null);
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result ?? ""),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const now = new Date();
    const uploadedAt = now.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const uploadedAtISO = now.toISOString().split("T")[0];

    const newDoc: DocRow = {
      id: `DOC${Date.now()}`,
      title: title.trim(),
      owner: "ทีมผู้จัดการ",
      category,
      eventOrCompany: eventOrCompany.trim() || "-",
      description: description.trim(),
      uploadedAt,
      uploadedAtISO,
      sizeLabel: selectedFile?.type || "ไฟล์แนบ",
      fileName: selectedFile?.name ?? fileName,
      fileUrl: selectedFile?.dataUrl,
      source: "manual",
    };

    onConfirm(newDoc);
    setTitle("");
    setCategory("invoice");
    setEventOrCompany("");
    setDescription("");
    setFileName("");
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <FilePlus className="h-5 w-5 text-red-600" />
            เพิ่มเอกสาร
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              ชื่อเอกสาร <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ใบแจ้งหนี้ - งานสัมมนา 2025"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              หมวดหมู่
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              อีเวนต์ / บริษัท
            </label>
            <input
              type="text"
              value={eventOrCompany}
              onChange={(e) => setEventOrCompany(e.target.value)}
              placeholder="เช่น งานสัมมนา 2025 / บริษัท เอบีซี จำกัด"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              คำอธิบาย
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายเนื้อหาเอกสารโดยย่อ..."
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              อัปโหลดไฟล์
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 px-4 py-3 hover:bg-zinc-50">
              <FilePlus className="h-5 w-5 text-zinc-400" />
              <span className={`text-sm ${fileName ? "text-zinc-900" : "text-zinc-500"}`}>
                {fileName || "คลิกเพื่อเลือกไฟล์..."}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            บันทึกเอกสาร
          </button>
        </div>
      </div>
    </div>
  );
}
