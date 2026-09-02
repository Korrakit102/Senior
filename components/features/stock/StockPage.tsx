"use client";

import { useMemo, useState } from "react";
import type { Role, StockRow, ItemStatus, Category } from "./types";
import {
  filterStockRows,
  getNextStockId,
  getStockStats,
  exportStockToExcel,
} from "./helpers";

import StockHeader from "./components/StockHeader";
import StockStats from "./components/StockStats";
import StockFilters from "./components/StockFilters";
import StockTable from "./components/StockTable";

import AddStockModal from "./modals/AddStockModal";
import EditStockModal from "./modals/EditStockModal";
import StockDetailModal from "./modals/StockDetailModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import ReceiveStockModal from "./modals/ReceiveStockModal";

type Props = {
  role: Role;
  stockData: StockRow[];
  onStockChange: (updater: any) => void;
  onStockReload: () => Promise<void>;
};

export default function StockPage({
  role,
  stockData,
  onStockChange,
  onStockReload,
}: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ทั้งหมด" | ItemStatus>("ทั้งหมด");
  const [category, setCategory] = useState<"ทั้งหมด" | Category>("ทั้งหมด");

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockRow | null>(null);
  const [detailItem, setDetailItem] = useState<StockRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<StockRow | null>(null);
  const [receiveStockOpen, setReceiveStockOpen] = useState(false);

  // filter
  const rows = useMemo(
    () => filterStockRows(stockData, q, status, category),
    [stockData, q, status, category]
  );

  // stats
  const stats = useMemo(() => getStockStats(stockData), [stockData]);

  // next id
  const nextId = useMemo(() => getNextStockId(stockData), [stockData]);

  // add
  const handleAdd = (row: StockRow) => {
    onStockChange((prev: StockRow[]) => [row, ...prev]);
  };

  // update
  const handleUpdate = (updated: StockRow) => {
    onStockChange((prev: StockRow[]) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  // 🔥 FIX: ลบ + ปิด modal
  const handleDelete = (id: string) => {
    onStockChange((prev: StockRow[]) =>
      prev.filter((r) => r.id !== id)
    );

    // 👇 อันนี้คือสิ่งที่ทำให้ modal ไม่ค้าง
    setDeleteItem(null);
  };

  return (
    <div className="px-6 py-8">
      {/* modals */}
      <AddStockModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        nextId={nextId}
      />

      <EditStockModal
        open={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onUpdate={handleUpdate}
      />

      <StockDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      <ConfirmDeleteModal
        open={!!deleteItem}
        itemName={deleteItem?.name || ""}
        onCancel={() => setDeleteItem(null)}
        onConfirm={() =>
          deleteItem && handleDelete(deleteItem.id)
        }
      />

      <ReceiveStockModal
        open={receiveStockOpen}
        items={stockData}
        role={role}
        onClose={() => setReceiveStockOpen(false)}
        onReceived={onStockReload}
      />

      {/* header */}
      <StockHeader
        onAdd={() => setAddOpen(true)}
        onExport={() => exportStockToExcel(rows)}
        onReceiveStock={() => setReceiveStockOpen(true)}
      />

      {/* stats */}
      <StockStats stats={stats} />

      {/* filters */}
      <StockFilters
        q={q}
        status={status}
        category={category}
        onQChange={setQ}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
        showing={rows.length}
        total={stockData.length}
      />

      {/* table */}
      <StockTable
        rows={rows}
        showEdit={role !== "SA"}
        showDelete={role === "Manager"}
        onView={setDetailItem}
        onEdit={setEditItem}
        onDelete={setDeleteItem}
      />
    </div>
  );
}