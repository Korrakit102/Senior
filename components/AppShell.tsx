"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Boxes,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import LoginPage from "./LoginPage";

import EventsPage from "./features/events/EventsPage";
import Stock from "./pages/Stock";
import IssueReturn from "./pages/IssueReturn";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";

export type Role = "SA" | "Manager" | "Stockkeeper";
type Tab = "events" | "stock" | "issueReturn" | "reports" | "settings";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  unreadFor: Role[];
  audience: Role[];
};

export type ItemStatus = "พร้อมใช้" | "ใช้งานอยู่" | "ซ่อมแซม";
export type Category = "ไฟฟ้า" | "ผ้าใบ" | "ตกแต่ง";

export type StockRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: Category;
  system: string;
  zone: string;
  status: ItemStatus;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
};

function toCategory(v: string): Category {
  return v === "ไฟฟ้า" || v === "ผ้าใบ" || v === "ตกแต่ง" ? v : "ตกแต่ง";
}

function toItemStatus(v: string): ItemStatus {
  return v === "พร้อมใช้" || v === "ใช้งานอยู่" || v === "ซ่อมแซม"
    ? v
    : "พร้อมใช้";
}

const initialStock: StockRow[] = [
  {
    id: "EQ001",
    code: "LT-1234",
    name: "ชุดไฟ LED หลากสี 200W",
    brand: "PRO LIGHT",
    category: "ไฟฟ้า",
    system: "ระบบแสง",
    zone: "โซน A",
    status: "พร้อมใช้",
    qty: 50,
    available: 50,
    pricePerDay: 800,
    cost: 15000,
  },
  {
    id: "EQ002",
    code: "LT-5678",
    name: "ชุดไฟ Moving Head 300W",
    brand: "STAGE PRO",
    category: "ไฟฟ้า",
    system: "ระบบแสง",
    zone: "โซน A",
    status: "พร้อมใช้",
    qty: 30,
    available: 28,
    pricePerDay: 1500,
    cost: 45000,
  },
  {
    id: "EQ003",
    code: "LT-9012",
    name: "ชุดไฟ Par Light LED RGB",
    brand: "LIGHT MASTER",
    category: "ไฟฟ้า",
    system: "ระบบแสง",
    zone: "โซน A",
    status: "พร้อมใช้",
    qty: 40,
    available: 35,
    pricePerDay: 600,
    cost: 12000,
  },
  {
    id: "EQ004",
    code: "ST-0001",
    name: "เวทีขนาดเล็ก 2x2 เมตร",
    brand: "STAGE TECH",
    category: "ผ้าใบ",
    system: "เวที",
    zone: "โซน B",
    status: "พร้อมใช้",
    qty: 20,
    available: 20,
    pricePerDay: 1200,
    cost: 25000,
  },
  {
    id: "EQ005",
    code: "ST-0002",
    name: "เวทีกลาง 4x4 เมตร",
    brand: "STAGE TECH",
    category: "ผ้าใบ",
    system: "เวที",
    zone: "โซน B",
    status: "พร้อมใช้",
    qty: 15,
    available: 12,
    pricePerDay: 2500,
    cost: 55000,
  },
  {
    id: "EQ006",
    code: "ST-0003",
    name: "เวทีขนาดใหญ่ 6x8 เมตร",
    brand: "STAGE TECH",
    category: "ผ้าใบ",
    system: "เวที",
    zone: "โซน B",
    status: "พร้อมใช้",
    qty: 10,
    available: 8,
    pricePerDay: 5000,
    cost: 120000,
  },
  {
    id: "EQ007",
    code: "GR-7890",
    name: "หญ้าเทียม (ม้วน 2x10 เมตร)",
    brand: "GREEN GRASS",
    category: "ตกแต่ง",
    system: "ตกแต่ง",
    zone: "โซน C",
    status: "พร้อมใช้",
    qty: 100,
    available: 85,
    pricePerDay: 300,
    cost: 3500,
  },
  {
    id: "EQ008",
    code: "ST-0004",
    name: "โต๊ะพับหน้าไม้ 180cm",
    brand: "FURNI PRO",
    category: "ตกแต่ง",
    system: "เฟอร์นิเจอร์",
    zone: "โซน C",
    status: "พร้อมใช้",
    qty: 180,
    available: 180,
    pricePerDay: 80,
    cost: 1200,
  },
  {
    id: "EQ009",
    code: "ST-0005",
    name: "เก้าอี้พลาสติก มีพนักพิง",
    brand: "FURNI PRO",
    category: "ตกแต่ง",
    system: "เฟอร์นิเจอร์",
    zone: "โซน C",
    status: "พร้อมใช้",
    qty: 420,
    available: 420,
    pricePerDay: 20,
    cost: 350,
  },
  {
    id: "EQ010",
    code: "AU-0001",
    name: "เครื่องเสียง PA System 2000W",
    brand: "SOUND MASTER",
    category: "ไฟฟ้า",
    system: "ระบบเสียง",
    zone: "โซน A",
    status: "พร้อมใช้",
    qty: 18,
    available: 18,
    pricePerDay: 2000,
    cost: 85000,
  },
  {
    id: "EQ011",
    code: "AU-0002",
    name: "ไมโครโฟนไร้สายคู่",
    brand: "SOUND MASTER",
    category: "ไฟฟ้า",
    system: "ระบบเสียง",
    zone: "โซน A",
    status: "พร้อมใช้",
    qty: 35,
    available: 35,
    pricePerDay: 600,
    cost: 8500,
  },
  {
    id: "EQ012",
    code: "AV-0001",
    name: "โปรเจคเตอร์ 5000 Lumens",
    brand: "VIEW PRO",
    category: "ไฟฟ้า",
    system: "ภาพ/โปรเจคเตอร์",
    zone: "โซน A",
    status: "พร้อมใช้",
    qty: 22,
    available: 22,
    pricePerDay: 1200,
    cost: 35000,
  },
];

const tabsByRole: Record<
  Role,
  { key: Tab; label: string; icon: React.ReactNode }[]
> = {
  SA: [
    {
      key: "events",
      label: "Events",
      icon: <CalendarDays className="h-4 w-4" />,
    },
  ],
  Manager: [
    {
      key: "events",
      label: "Events",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      key: "stock",
      label: "Stock",
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      key: "issueReturn",
      label: "Issue/Return",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ],
  Stockkeeper: [
    {
      key: "events",
      label: "Events",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      key: "stock",
      label: "Stock",
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      key: "issueReturn",
      label: "Issue/Return",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ],
};

function getRoleLabel(role: Role) {
  if (role === "SA") return "Customer";
  return role;
}

function getRoleShort(role: Role) {
  if (role === "SA") return "C";
  if (role === "Manager") return "M";
  return "K";
}

function LogoMark() {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-sm">
        <span className="text-lg font-black">⬢</span>
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold text-zinc-900">
          Event Stock Manager
        </div>
        <div className="text-xs text-zinc-500">ระบบบริหารจัดการ Stock</div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === "SA"
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : role === "Manager"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-violet-50 text-violet-700 ring-violet-100";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {getRoleLabel(role)}
    </span>
  );
}

export default function AppShell() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>("Manager");
  const tabs = useMemo(() => tabsByRole[role], [role]);
  const [tab, setTab] = useState<Tab>("events");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = React.useRef<HTMLDivElement | null>(null);

  const [stockData, setStockData] = useState<StockRow[]>(initialStock);
  const [stockSaveError, setStockSaveError] = useState(false);

  const [issuedEventIds, setIssuedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadStock = async () => {
      try {
        const res = await fetch("/api/stock");
        if (!res.ok) throw new Error("failed to load stock");
        const rows = (await res.json()) as Array<{
          id: string;
          code: string;
          name: string;
          brand: string;
          category: string;
          system: string;
          zone: string;
          status: string;
          qty: number;
          available: number;
          pricePerDay: number;
          cost: number;
        }>;

        if (rows.length === 0) {
          await fetch("/api/stock", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: initialStock }),
          });
          setStockData(initialStock);
          return;
        }

        setStockData(
          rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            brand: r.brand,
            category: toCategory(r.category),
            system: r.system,
            zone: r.zone,
            status: toItemStatus(r.status),
            qty: r.qty,
            available: r.available,
            pricePerDay: r.pricePerDay,
            cost: r.cost,
          }))
        );
      } catch {
        setStockData(initialStock);
      }
    };
    loadStock();
  }, []);

  const applyStockChange = (
    updater: StockRow[] | ((prev: StockRow[]) => StockRow[])
  ) => {
    setStockData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: next }),
      }).catch(() => {
        setStockData(prev);
        setStockSaveError(true);
      });
      return next;
    });
  };

  const deductStock = (equipmentList: { name: string; qty: number }[]) => {
    applyStockChange((prev) =>
      prev.map((row) => {
        const match = equipmentList.find((eq) => eq.name === row.name);
        if (!match) return row;
        const newAvailable = Math.max(0, row.available - match.qty);
        return {
          ...row,
          available: newAvailable,
          status: newAvailable === 0 ? "ใช้งานอยู่" : row.status,
        };
      })
    );
  };

  const returnStock = (equipmentList: { name: string; qty: number }[]) => {
    applyStockChange((prev) =>
      prev.map((row) => {
        const match = equipmentList.find((eq) => eq.name === row.name);
        if (!match) return row;
        const newAvailable = Math.min(row.qty, row.available + match.qty);
        return {
          ...row,
          available: newAvailable,
          status: newAvailable > 0 ? "พร้อมใช้" : row.status,
        };
      })
    );
  };

  const markDamagedStock = (equipmentList: { name: string; qty: number }[]) => {
    applyStockChange((prev) =>
      prev.map((row) => {
        const match = equipmentList.find((eq) => eq.name === row.name);
        if (!match) return row;
        return {
          ...row,
          status: "ซ่อมแซม",
        };
      })
    );
  };

  const markEventAsIssued = (eventId: string) => {
    setIssuedEventIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });
  };

  const unmarkEventAsIssued = (eventId: string) => {
    setIssuedEventIds((prev) => {
      if (!prev.has(eventId)) return prev;
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  const isSA = role === "SA";

  useEffect(() => {
    const allowed = tabsByRole[role].map((t) => t.key);
    if (!allowed.includes(tab)) setTab(allowed[0]);
  }, [role, tab]);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const res = await fetch(`/api/notifications?role=${role}&unread=true`);
        if (!res.ok) throw new Error("fail");
        const data = (await res.json()) as NotificationItem[];
        setUnread(data.length);
      } catch {
        setUnread(0);
      }
    };
    loadUnread();
  }, [role]);

  useEffect(() => {
    const onNew = (e: Event) => {
      const detail = (e as CustomEvent<NotificationItem>).detail;
      setNotifList((prev) => [detail, ...prev]);
      if (detail.unreadFor.includes(role)) setUnread((c) => c + 1);
    };
    const onUnread = (e: Event) => {
      const detail = (e as CustomEvent<{ counts: Record<string, number> }>).detail;
      if (detail?.counts?.[role] !== undefined) setUnread(detail.counts[role]);
    };
    window.addEventListener("app:notification:new", onNew as EventListener);
    window.addEventListener("app:notification:unread", onUnread as EventListener);
    return () => {
      window.removeEventListener("app:notification:new", onNew as EventListener);
      window.removeEventListener("app:notification:unread", onUnread as EventListener);
    };
  }, [role]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!notifOpen) return;
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  const openNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?role=${role}`);
      if (res.ok) {
        const data = (await res.json()) as NotificationItem[];
        setNotifList(data);
      }
      setNotifOpen(true);
      if (unread > 0) {
        await fetch("/api/notifications/mark-read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        setNotifList((prev) =>
          prev.map((n) => ({
            ...n,
            unreadFor: n.unreadFor.filter((r) => r !== role),
          }))
        );
        setUnread(0);
      }
    } catch {
      setNotifOpen(true);
    }
  };

  const renderTabButton = (t: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
  }) => {
    const active = tab === t.key;
    return (
      <button
        key={t.key}
        onClick={() => setTab(t.key)}
        className={[
          "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
          active
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        {t.icon}
        {t.label}
      </button>
    );
  };

  const handleLogin = (loginRole: Role) => {
    setRole(loginRole);
    setTab("events");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole("Manager");
    setTab("events");
    setNotifOpen(false);
    setNotifList([]);
    setUnread(0);
    setIssuedEventIds(new Set());
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {stockSaveError && (
        <div className="fixed bottom-6 left-1/2 z-[300] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 shadow-lg">
            <span className="text-sm font-medium text-red-700">บันทึกข้อมูล Stock ไม่สำเร็จ — ข้อมูลถูกย้อนกลับแล้ว</span>
            <button
              onClick={() => setStockSaveError(false)}
              className="ml-2 text-xs font-semibold text-red-500 hover:text-red-700"
            >
              ปิด ✕
            </button>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <div className="shrink-0">
            <LogoMark />
          </div>

          {!isSA && (
            <div className="hidden flex-1 items-center justify-center gap-2 md:flex">
              {tabs.map(renderTabButton)}
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {isSA && (
              <div className="hidden items-center gap-2 md:flex">
                {renderTabButton(tabsByRole.SA[0])}
              </div>
            )}

            <div className="hidden md:block">
              <RoleBadge role={role} />
            </div>

            <button
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[200] w-80 rounded-2xl border border-zinc-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between px-4 pb-2 pt-3">
                    <div className="text-sm font-semibold text-zinc-900">การแจ้งเตือน</div>
                    <div className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                      {unread} ใหม่
                    </div>
                  </div>
                  <div className="max-h-96 divide-y divide-zinc-100 overflow-auto">
                    {notifList.length === 0 ? (
                      <div className="p-4 text-sm text-zinc-500">ยังไม่มีการแจ้งเตือน</div>
                    ) : (
                      notifList.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50"
                        >
                          <div className="mt-0.5">
                            <Bell className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-zinc-900">
                              {n.title}
                            </div>
                            <div className="mt-0.5 text-xs text-zinc-600">
                              {n.message}
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-400">
                              {new Date(n.createdAt).toLocaleString("th-TH")}
                            </div>
                          </div>
                          {n.unreadFor.includes(role) ? (
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700">
                {getRoleShort(role)}
              </div>
              <div className="hidden leading-tight md:block">
                <div className="text-sm font-semibold text-zinc-900">
                  {getRoleLabel(role)} Team
                </div>
                <div className="text-xs text-zinc-500">{getRoleLabel(role)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-2">
        {tab === "events" && (
          <EventsPage
            role={role}
            stockData={stockData}
            onDeductStock={deductStock}
            onReturnStock={returnStock}
            issuedEventIds={issuedEventIds}
          />
        )}
        {tab === "stock" && (
          <Stock
            role={role}
            stockData={stockData}
            onStockChange={applyStockChange}
          />
        )}
        {tab === "issueReturn" && (
          <IssueReturn
           key={tab}
           role={role}
            stockData={stockData}
            onDeductStock={deductStock}
            onReturnStock={returnStock}
            onMarkDamagedStock={markDamagedStock}
            onMarkEventAsIssued={markEventAsIssued}
            onUnmarkEventAsIssued={unmarkEventAsIssued}
          />
        )}
        {tab === "reports" && <Reports role={role} stockData={stockData} />}
        {tab === "settings" && role === "Manager" && <SettingsPage />}
        {tab === "settings" && role !== "Manager" && (
          <div className="px-6 py-10 text-sm text-zinc-500">Manager Only</div>
        )}
      </div>
    </div>
  );
}