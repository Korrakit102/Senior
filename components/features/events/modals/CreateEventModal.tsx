"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Plus, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { CreateForm } from "../types";
import { toDateLocal, toYMD } from "../helpers";

const MAX_BUDGET_THB = 2_000_000_000;
const MAX_BUDGET_DIGITS = String(MAX_BUDGET_THB);

function Input({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  min,
  hint,
  maxLength,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  min?: string;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) =>
          onChange(maxLength !== undefined ? e.target.value.slice(0, maxLength) : e.target.value)
        }
        type={type}
        placeholder={placeholder}
        min={min}
        maxLength={maxLength}
        className={[
          "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
        ].join(" ")}
      />
      {error ? (
        <div className="mt-1 text-xs text-red-600">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-zinc-500">{hint}</div>
      ) : null}
    </div>
  );
}

function formatBudgetDisplay(digits: string) {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function clampBudgetDigits(digits: string) {
  const normalized = digits.replace(/^0+(?=\d)/, "");
  if (
    normalized.length > MAX_BUDGET_DIGITS.length ||
    (normalized.length === MAX_BUDGET_DIGITS.length && normalized > MAX_BUDGET_DIGITS)
  ) {
    return MAX_BUDGET_DIGITS;
  }
  return normalized;
}

function BudgetInput({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  hint,
  maxDigits,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  maxDigits?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input.selectionStart === null || input.selectionStart !== input.selectionEnd) return;
    const pos = input.selectionStart;
    if (e.key === "Backspace" && pos > 0 && input.value[pos - 1] === ",") {
      input.setSelectionRange(pos - 1, pos - 1);
    } else if (e.key === "Delete" && pos < input.value.length && input.value[pos] === ",") {
      input.setSelectionRange(pos + 1, pos + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, cursor).replace(/[^0-9]/g, "").length;
    const rawDigits = input.value.replace(/[^0-9]/g, "");
    const limitedDigits = maxDigits !== undefined ? rawDigits.slice(0, maxDigits) : rawDigits;
    const nextDigits = clampBudgetDigits(limitedDigits);
    const nextDigitsBeforeCursor =
      nextDigits === rawDigits ? digitsBeforeCursor : Math.min(digitsBeforeCursor, nextDigits.length);

    onChange(nextDigits);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const formatted = formatBudgetDisplay(nextDigits);
      let seen = 0;
      let caretPos = formatted.length;
      const targetDigits = Math.min(nextDigitsBeforeCursor, nextDigits.length);
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) seen++;
        if (seen === targetDigits) {
          caretPos = i + 1;
          break;
        }
      }
      if (targetDigits === 0) caretPos = 0;
      inputRef.current.setSelectionRange(caretPos, caretPos);
    });
  };

  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <input
        ref={inputRef}
        value={formatBudgetDisplay(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        className={[
          "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
        ].join(" ")}
      />
      {error ? (
        <div className="mt-1 text-xs text-red-600">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-zinc-500">{hint}</div>
      ) : null}
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
                    <span className="truncate">
                      เพิ่มบริษัท &quot;{trimmedValue}&quot;
                    </span>
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
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-zinc-700">{label}</div>
        {maxLength ? (
          <div className="text-xs font-medium text-zinc-500">
            {value.length}/{maxLength}
          </div>
        ) : null}
      </div>
      <textarea
        value={value}
        onChange={(e) =>
          onChange(
            maxLength ? e.target.value.slice(0, maxLength) : e.target.value
          )
        }
        placeholder={placeholder}
        maxLength={maxLength}
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

  useBodyScrollLock(open);

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
    if (
      form.budgetTHB.trim() &&
      !Number.isNaN(Number(form.budgetTHB)) &&
      Number(form.budgetTHB) > MAX_BUDGET_THB
    ) {
      e.budgetTHB = "งบประมาณต้องไม่เกิน 2,000,000,000 บาท";
    }
    if (!form.venue.trim()) e.venue = "กรุณากรอกสถานที่";
    if (!form.startDate) e.startDate = "กรุณาเลือกวันเริ่ม";
    if (!form.endDate) e.endDate = "กรุณาเลือกวันจบ";
    const today = toDateLocal(toYMD(new Date()));
    if (form.startDate && toDateLocal(form.startDate) < today) {
      e.startDate = "วันเริ่มต้องไม่ย้อนหลัง";
    }
    if (form.endDate && toDateLocal(form.endDate) < today) {
      e.endDate = "วันจบต้องไม่ย้อนหลัง";
    }
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
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center">
        <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 p-5">
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

          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 pt-5">
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
                maxLength={15}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="รหัสสาขา"
                value={form.branchCode}
                onChange={(v) => setForm((s) => ({ ...s, branchCode: v }))}
                placeholder="รหัสสาขา (ไม่บังคับ)"
              />
              <BudgetInput
                label="งบประมาณ (บาท)"
                required
                value={form.budgetTHB}
                onChange={(v) => setForm((s) => ({ ...s, budgetTHB: v }))}
                placeholder="กรอกจำนวนงบประมาณ"
                error={errors.budgetTHB}
                hint="กรอกได้สูงสุด 2,000,000,000 บาท"
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="คำอธิบาย"
                value={form.description}
                onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                maxLength={200}
              />
            </div>

            <div className="mt-4">
              <BudgetInput
                label="จำนวนผู้เข้าร่วม"
                value={form.attendees}
                onChange={(v) => setForm((s) => ({ ...s, attendees: v }))}
                placeholder="กรอกจำนวนผู้เข้าร่วม"
                maxDigits={6}
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
                min={toYMD(new Date())}
              />
              <Input
                label="วันจบอีเวนต์"
                required
                type="date"
                value={form.endDate}
                onChange={(v) => setForm((s) => ({ ...s, endDate: v }))}
                error={errors.endDate}
                min={toYMD(new Date())}
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
