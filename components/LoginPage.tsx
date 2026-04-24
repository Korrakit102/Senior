"use client";

import React, { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import type { Role } from "./AppShell";

const CREDENTIALS: Record<Role, string> = {
  SA: "customer123",
  Manager: "manager123",
  Stockkeeper: "stock123",
};

const ROLE_CONFIG: {
  role: Role;
  label: string;
  desc: string;
  color: string;
  badge: string;
  short: string;
}[] = [
  {
    role: "SA",
    label: "Customer",
    desc: "ดูข้อมูล Events",
    color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    badge: "bg-blue-600",
    short: "C",
  },
  {
    role: "Manager",
    label: "Manager",
    desc: "จัดการระบบทั้งหมด",
    color:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    badge: "bg-emerald-600",
    short: "M",
  },
  {
    role: "Stockkeeper",
    label: "Stockkeeper",
    desc: "จัดการ Stock & Issue/Return",
    color: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
    badge: "bg-violet-600",
    short: "K",
  },
];

interface LoginPageProps {
  onLogin: (role: Role) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!selectedRole) {
      setError("กรุณาเลือก Role ก่อน");
      return;
    }
    if (password === CREDENTIALS[selectedRole]) {
      onLogin(selectedRole);
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
      setPassword("");
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setPassword("");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-600 text-white shadow-md">
            <span className="text-2xl font-black">⬢</span>
          </div>
          <div>
            <div className="text-xl font-bold text-zinc-900">
              Event Stock Manager
            </div>
            <div className="text-sm text-zinc-500">ระบบบริหารจัดการ Stock</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900">
            เข้าสู่ระบบ
          </h2>
          <p className="mb-6 text-sm text-zinc-500">เลือก Role แล้วกรอกรหัสผ่าน</p>

          {/* Role selector */}
          <div className="mb-5 space-y-2">
            {ROLE_CONFIG.map((cfg) => (
              <button
                key={cfg.role}
                onClick={() => handleRoleSelect(cfg.role)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${cfg.color} ${
                  selectedRole === cfg.role
                    ? "ring-2 ring-offset-1 " +
                      (cfg.role === "SA"
                        ? "ring-blue-400"
                        : cfg.role === "Manager"
                        ? "ring-emerald-400"
                        : "ring-violet-400")
                    : ""
                }`}
              >
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white ${cfg.badge}`}
                >
                  {cfg.short}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{cfg.label}</div>
                  <div className="text-xs opacity-70">{cfg.desc}</div>
                </div>
                {selectedRole === cfg.role && (
                  <div className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                )}
              </button>
            ))}
          </div>

          {/* Password input */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="กรอกรหัสผ่าน"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-zinc-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
            )}
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800"
          >
            <LogIn className="h-4 w-4" />
            เข้าสู่ระบบ
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Event Stock Manager &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
