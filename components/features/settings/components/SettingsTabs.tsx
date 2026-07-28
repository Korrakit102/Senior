"use client";

import React from "react";
import { Building2, CreditCard } from "lucide-react";
import type { SettingsTab } from "../types";

function SegTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
          : "text-zinc-500 hover:text-zinc-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SettingsTabs({
  tab,
  onChange,
}: {
  tab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <SegTab
          active={tab === "company"}
          onClick={() => onChange("company")}
          icon={<Building2 className="h-4 w-4" />}
          label="ข้อมูลบริษัท"
        />

        <SegTab
          active={tab === "banking"}
          onClick={() => onChange("banking")}
          icon={<CreditCard className="h-4 w-4" />}
          label="ข้อมูลธนาคาร"
        />
      </div>
    </div>
  );
}
