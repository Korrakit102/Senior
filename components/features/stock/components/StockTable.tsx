import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { StockRow } from "../types";
import { fmt, getCategoryTone, getStatusTone } from "../helpers";
import StockPill from "./StockPill";

type Props = {
  rows: StockRow[];
  showEdit: boolean;
  showDelete: boolean;
  onView: (item: StockRow) => void;
  onEdit: (item: StockRow) => void;
  onDelete: (item: StockRow) => void;
};

function RowActionsMenu({
  row,
  showEdit,
  showDelete,
  onEdit,
  onDelete,
}: {
  row: StockRow;
  showEdit: boolean;
  showDelete: boolean;
  onEdit: (item: StockRow) => void;
  onDelete: (item: StockRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }

    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
        title="ตัวเลือกเพิ่มเติม"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: position.top, right: position.right }}
            className="fixed z-50 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 text-left shadow-lg"
          >
            {showEdit && (
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <Pencil className="h-4 w-4" />
                แก้ไข
              </button>
            )}

            {showDelete && (
              <button
                onClick={() => {
                  setOpen(false);
                  onDelete(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                ลบ
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

export default function StockTable({
  rows,
  showEdit,
  showDelete,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead className="bg-white">
            <tr className="border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500">
              <th className="px-6 py-4">รหัสระบบ / รหัสอุปกรณ์</th>
              <th className="px-6 py-4">ชื่ออุปกรณ์</th>
              <th className="px-6 py-4">ยี่ห้อ</th>
              <th className="px-6 py-4">ประเภท</th>
              <th className="px-6 py-4">จัดเก็บ</th>
              <th className="px-6 py-4">สถานะ</th>
              <th className="px-6 py-4 text-center">จำนวน</th>
              <th className="px-6 py-4 text-center">ค่าบริการ/วัน</th>
              <th className="px-6 py-4 text-center">ราคาต้นทุน</th>
              <th className="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-sm text-zinc-800">
            {rows.map((r, idx) => {
              const catTone = getCategoryTone(r.category);
              const statusTone = getStatusTone(r.status);

              return (
                <tr
                  key={`${r.id}-${idx}`}
                  className={idx % 2 ? "bg-zinc-50/30" : "bg-white"}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <StockPill tone="blue">{r.id}</StockPill>
                      <StockPill tone="blue">{r.code}</StockPill>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="font-semibold text-zinc-900">{r.name}</div>
                  </td>

                  <td className="px-6 py-5">{r.brand}</td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <StockPill tone={catTone}>{r.category}</StockPill>
                      <span className="text-zinc-500">{r.system}</span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <StockPill tone="blue">{r.zone}</StockPill>
                  </td>

                  <td className="px-6 py-5">
                    <StockPill tone={statusTone}>{r.status}</StockPill>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="font-semibold">{fmt(r.qty)}</div>
                    <div className="text-xs text-zinc-500">
                      ({fmt(r.available)} พร้อมใช้)
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">{fmt(r.pricePerDay)} ฿</td>
                  <td className="px-6 py-5 text-center">{fmt(r.cost)} ฿</td>

                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(r)}
                        className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                        title="ดู"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <RowActionsMenu
                        row={r}
                        showEdit={showEdit}
                        showDelete={showDelete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
