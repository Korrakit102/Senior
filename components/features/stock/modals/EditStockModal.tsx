"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { EditForm, Category, ItemStatus, StockRow } from "../types";
import StockField from "../components/StockField";
import SystemDropdown from "../components/SystemDropdown";

type Props = {
  open: boolean;
  item: StockRow | null;
  onClose: () => void;
  onUpdate: (updated: StockRow) => void;
};

export default function EditStockModal({
  open,
  item,
  onClose,
  onUpdate,
}: Props) {
  const [form, setForm] = useState<EditForm>({
    status: "พร้อมใช้",
    name: "",
    brand: "",
    category: "ไฟฟ้า",
    typeLabel: "ระบบแสง",
    zone: "โซน A",
    qty: "",
    available: "",
    pricePerDay: "",
    cost: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useBodyScrollLock(open && Boolean(item));

  React.useEffect(() => {
    if (!open || !item) return;
    setForm({
      status: item.status,
      name: item.name,
      brand: item.brand,
      category: item.category,
      typeLabel: item.system,
      zone: item.zone,
      qty: String(item.qty),
      available: String(item.available),
      pricePerDay: String(item.pricePerDay),
      cost: String(item.cost),
    });
    setErrors({});
  }, [open, item]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "กรุณากรอกชื่ออุปกรณ์";
    if (!form.brand.trim()) e.brand = "กรุณากรอกยี่ห้อ";
    if (!form.zone.trim()) e.zone = "กรุณาเลือกโซน";

    if (!form.qty.trim()) {
      e.qty = "กรุณาระบุจำนวนรวม";
    } else if (Number.isNaN(Number(form.qty)) || Number(form.qty) < 0) {
      e.qty = "จำนวนรวมต้องเป็นตัวเลข";
    }

    if (!form.pricePerDay.trim()) {
      e.pricePerDay = "กรุณาระบุค่าบริการ/วัน";
    } else if (
      Number.isNaN(Number(form.pricePerDay)) ||
      Number(form.pricePerDay) < 0
    ) {
      e.pricePerDay = "ค่าบริการต้องเป็นตัวเลข";
    }

    if (!form.cost.trim()) {
      e.cost = "กรุณาระบุราคาต้นทุน";
    } else if (Number.isNaN(Number(form.cost)) || Number(form.cost) < 0) {
      e.cost = "ราคาต้นทุนต้องเป็นตัวเลข";
    }

    if (!form.typeLabel.trim()) {
      e.typeLabel = "กรุณาเลือกหมวดหมู่";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate() || !item) return;

    onUpdate({
      ...item,
      status: form.status,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      system: form.typeLabel.trim(),
      zone: form.zone,
      qty: Number(form.qty),
      available: Number(form.available),
      pricePerDay: Number(form.pricePerDay),
      cost: Number(form.cost),
    });

    onClose();
  };

  if (!open || !item) return null;

  const inp = (err?: string) =>
    [
      "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
      err
        ? "border-red-300 ring-2 ring-red-100"
        : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
    ].join(" ");

  const disabledCls =
    "h-10 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 outline-none cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                แก้ไขอุปกรณ์
              </div>
              <div className="mt-1 text-sm text-zinc-500">{item.name}</div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StockField label="รหัส" required>
                <input disabled value={item.id} className={disabledCls} />
              </StockField>

              <StockField label="สถานะ" required>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as ItemStatus,
                    }))
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="พร้อมใช้">พร้อมใช้</option>
                  <option value="ใช้งานอยู่">ใช้งานอยู่</option>
                  <option value="ซ่อมแซม">ซ่อมแซม</option>
                </select>
              </StockField>

              <StockField label="ชื่ออุปกรณ์" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="ชื่ออุปกรณ์"
                  className={inp(errors.name)}
                />
              </StockField>

              <StockField label="ยี่ห้อ" required error={errors.brand}>
                <input
                  value={form.brand}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  placeholder="ยี่ห้อ"
                  className={inp(errors.brand)}
                />
              </StockField>

              <StockField label="โซน" required error={errors.zone}>
                <select
                  value={form.zone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, zone: e.target.value }))
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="โซน A">โซน A</option>
                  <option value="โซน B">โซน B</option>
                  <option value="โซน C">โซน C</option>
                </select>
              </StockField>

              <StockField label="ประเภท" required>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category: e.target.value as Category,
                    }))
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="ไฟฟ้า">ไฟฟ้า</option>
                  <option value="ผ้าใบ">ผ้าใบ</option>
                  <option value="ตกแต่ง">ตกแต่ง</option>
                </select>
              </StockField>

              <StockField label="จำนวนรวม" required error={errors.qty}>
                <input
                  value={form.qty}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, qty: e.target.value }))
                  }
                  placeholder="ระบุจำนวนรวม"
                  className={inp(errors.qty)}
                />
              </StockField>

              <StockField label="จำนวนพร้อมใช้" required>
                <input disabled value={form.available} className={disabledCls} />
              </StockField>

              <StockField
                label="ค่าบริการ/วัน (บาท)"
                required
                error={errors.pricePerDay}
              >
                <input
                  value={form.pricePerDay}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricePerDay: e.target.value,
                    }))
                  }
                  placeholder="ระบุค่าบริการต่อวัน"
                  className={inp(errors.pricePerDay)}
                />
              </StockField>

              <StockField label="ราคาต้นทุน (บาท)" required error={errors.cost}>
                <input
                  value={form.cost}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cost: e.target.value }))
                  }
                  placeholder="ระบุราคาต้นทุน"
                  className={inp(errors.cost)}
                />
              </StockField>

              <div className="md:col-span-2">
                <StockField label="หมวดหมู่" required error={errors.typeLabel}>
                  <SystemDropdown
                    value={form.typeLabel}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, typeLabel: v }))
                    }
                    error={errors.typeLabel}
                  />
                </StockField>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submit}
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
