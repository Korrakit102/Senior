"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Plus, X } from "lucide-react";
import type { CreateForm } from "../types";
import { toDateLocal } from "../helpers";

function Input({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className={[
          "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
        ].join(" ")}
      />
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function CompanyDropdown({
  label,
  required,
  value,
  onChange,
  onAddOption,
  placeholder,
  options,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onAddOption: (v: string) => void;
  placeholder?: string;
  options: string[];
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open || !ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trimmedValue = value.trim();

  const filtered = useMemo(() => {
    const needle = trimmedValue.toLowerCase();
    if (!needle) return options;
    return options.filter((opt) => opt.toLowerCase().includes(needle));
  }, [options, trimmedValue]);

  const exactExists = useMemo(() => {
    return options.some(
      (opt) => opt.trim().toLowerCase() === trimmedValue.toLowerCase()
    );
  }, [options, trimmedValue]);

  const canAddNew = trimmedValue.length > 0 && !exactExists;

  return (
    <div ref={ref} className="relative">
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        type="text"
        placeholder={placeholder}
        className={[
          "h-10 w-full rounded-xl border bg-zinc-50 px-3 pr-9 text-sm text-zinc-900 outline-none",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
        ].join(" ")}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute inset-y-0 right-2 grid place-items-center text-zinc-400 hover:text-zinc-600"
        aria-label="เปิด/ปิดรายการบริษัท"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 && !canAddNew ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                ไม่พบบริษัท
              </div>
            ) : (
              <>
                {filtered.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                  >
                    <span className="truncate">{opt}</span>
                    {opt.trim().toLowerCase() === trimmedValue.toLowerCase() ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : null}
                  </button>
                ))}

                {canAddNew && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddOption(trimmedValue);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="truncate">เพิ่มบริษัท "{trimmedValue}"</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-20 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
      />
    </div>
  );
}

export default function CreateEventModal({
  open,
  onClose,
  onCreate,
  companyOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    company: string;
    organizer: string;
    contactName: string;
    contactPhone: string;
    branchCode?: string;
    budgetTHB?: number;
    desc?: string;
    attendees?: number;
    place: string;
    startDate: string;
    endDate: string;
  }) => void;
  companyOptions: string[];
}) {
  const [form, setForm] = useState<CreateForm>({
    eventName: "",
    companyName: "",
    organizerName: "",
    contactName: "",
    contactPhone: "",
    branchCode: "",
    budgetTHB: "",
    description: "",
    attendees: "",
    venue: "",
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyList, setCompanyList] = useState<string[]>(companyOptions);

  useEffect(() => {
    setCompanyList(companyOptions);
  }, [companyOptions]);

  const handleAddCompany = (newCompany: string) => {
    const cleaned = newCompany.trim();
    if (!cleaned) return;

    setForm((s) => ({ ...s, companyName: cleaned }));

    setCompanyList((prev) => {
      const exists = prev.some(
        (item) => item.trim().toLowerCase() === cleaned.toLowerCase()
      );
      if (exists) return prev;
      return [...prev, cleaned];
    });
  };

  const reset = () => {
    setForm({
      eventName: "",
      companyName: "",
      organizerName: "",
      contactName: "",
      contactPhone: "",
      branchCode: "",
      budgetTHB: "",
      description: "",
      attendees: "",
      venue: "",
      startDate: "",
      endDate: "",
    });
    setErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.eventName.trim()) e.eventName = "กรุณากรอกชื่ออีเวนต์";
    if (!form.companyName.trim()) e.companyName = "กรุณากรอกชื่อบริษัท";
    if (!form.organizerName.trim()) e.organizerName = "กรุณากรอกชื่อลูกค้า";
    if (!form.contactName.trim()) e.contactName = "กรุณากรอกชื่อผู้ติดต่อ";
    if (!form.contactPhone.trim()) e.contactPhone = "กรุณากรอกเบอร์โทร";
    if (!form.budgetTHB.trim()) e.budgetTHB = "กรุณากรอกงบประมาณ";
    if (form.budgetTHB.trim() && Number.isNaN(Number(form.budgetTHB))) {
      e.budgetTHB = "งบประมาณต้องเป็นตัวเลข";
    }
    if (!form.venue.trim()) e.venue = "กรุณากรอกสถานที่";
    if (!form.startDate) e.startDate = "กรุณาเลือกวันเริ่ม";
    if (!form.endDate) e.endDate = "กรุณาเลือกวันจบ";
    if (
      form.startDate &&
      form.endDate &&
      toDateLocal(form.startDate) > toDateLocal(form.endDate)
    ) {
      e.endDate = "วันจบต้องไม่ก่อนวันเริ่ม";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    onCreate({
      title: form.eventName.trim(),
      company: form.companyName.trim(),
      organizer: form.organizerName.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      branchCode: form.branchCode.trim() || undefined,
      budgetTHB: form.budgetTHB.trim() ? Number(form.budgetTHB) : undefined,
      desc: form.description.trim() || undefined,
      attendees: form.attendees.trim() ? Number(form.attendees) : undefined,
      place: form.venue.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    });

    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">สร้างอีเวนต์ใหม่</div>
              <div className="mt-1 text-sm text-zinc-500">
                กรอกรายละเอียดอีเวนต์และข้อมูลที่จำเป็น
              </div>
            </div>
            <button
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="ชื่ออีเวนต์"
                required
                value={form.eventName}
                onChange={(v) => setForm((s) => ({ ...s, eventName: v }))}
                error={errors.eventName}
              />
              <CompanyDropdown
                label="ชื่อบริษัท"
                required
                value={form.companyName}
                onChange={(v) => setForm((s) => ({ ...s, companyName: v }))}
                onAddOption={handleAddCompany}
                placeholder="เลือกหรือพิมพ์ชื่อบริษัท"
                options={companyList}
                error={errors.companyName}
              />
            </div>

            <div className="mt-4">
              <Input
                label="ชื่อลูกค้า"
                required
                value={form.organizerName}
                onChange={(v) => setForm((s) => ({ ...s, organizerName: v }))}
                placeholder="ชื่อ-นามสกุลลูกค้า"
                error={errors.organizerName}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="ชื่อผู้ติดต่อ"
                required
                value={form.contactName}
                onChange={(v) => setForm((s) => ({ ...s, contactName: v }))}
                placeholder="ชื่อผู้ประสานงาน"
                error={errors.contactName}
              />
              <Input
                label="เบอร์โทรผู้ติดต่อ"
                required
                value={form.contactPhone}
                onChange={(v) => setForm((s) => ({ ...s, contactPhone: v }))}
                placeholder="กรอกเบอร์โทรผู้ติดต่อ"
                error={errors.contactPhone}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="รหัสสาขา"
                value={form.branchCode}
                onChange={(v) => setForm((s) => ({ ...s, branchCode: v }))}
                placeholder="รหัสสาขา (ไม่บังคับ)"
              />
              <Input
                label="งบประมาณ (บาท)"
                required
                value={form.budgetTHB}
                onChange={(v) => setForm((s) => ({ ...s, budgetTHB: v }))}
                placeholder="กรอกจำนวนงบประมาณ"
                error={errors.budgetTHB}
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="คำอธิบาย"
                value={form.description}
                onChange={(v) => setForm((s) => ({ ...s, description: v }))}
              />
            </div>

            <div className="mt-4">
              <Input
                label="จำนวนผู้เข้าร่วม"
                value={form.attendees}
                onChange={(v) => setForm((s) => ({ ...s, attendees: v }))}
                placeholder="กรอกจำนวนผู้เข้าร่วม"
              />
            </div>

            <div className="mt-4">
              <Input
                label="สถานที่จัดงาน"
                required
                value={form.venue}
                onChange={(v) => setForm((s) => ({ ...s, venue: v }))}
                error={errors.venue}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="วันเริ่มอีเวนต์"
                required
                type="date"
                value={form.startDate}
                onChange={(v) => setForm((s) => ({ ...s, startDate: v }))}
                error={errors.startDate}
              />
              <Input
                label="วันจบอีเวนต์"
                required
                type="date"
                value={form.endDate}
                onChange={(v) => setForm((s) => ({ ...s, endDate: v }))}
                error={errors.endDate}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={close}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submit}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                สร้างอีเวนต์
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
