"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { SettingsState, SettingsTab } from "./types";
import {
  getSettingsSubtitle,
  getSettingsTitle,
  normalizeLegacySettings,
  resetSettingsToDefault,
} from "./helpers";
import { DEFAULT_SETTINGS } from "./constants";

import SettingsHeader from "./components/SettingsHeader";
import SettingsTabs from "./components/SettingsTabs";
import SettingsCard from "./components/SettingsCard";
import SettingsField from "./components/SettingsField";
import SettingsTextArea from "./components/SettingsTextArea";
import SettingsFooter from "./components/SettingsFooter";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("company");
  const [data, setData] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedData, setSavedData] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as SettingsState;
        if (json?.company && json?.banking) {
          const normalized = normalizeLegacySettings(json);
          setData(normalized);
          setSavedData(normalized);
        }
      } catch {
        // keep DEFAULT_SETTINGS
      }
    };
    load();
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(savedData),
    [data, savedData]
  );

  useEffect(() => {
    if (hasChanges && saveStatus === "saved") {
      setSaveStatus("idle");
    }
  }, [hasChanges, saveStatus]);

  const confirmSave = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("failed");
      setSavedData(data);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const reset = async () => {
    const defaults = resetSettingsToDefault();
    setData(defaults);
    setSaveStatus("idle");
  };

  const title = useMemo(() => getSettingsTitle(tab), [tab]);
  const subtitle = useMemo(() => getSettingsSubtitle(tab), [tab]);

  const company = data.company;
  const banking = data.banking;

  return (
    <div className="px-6 py-8">
      <SettingsHeader onAddCompanyInfo={() => setIsCompanyInfoOpen(true)} />

      <SettingsTabs tab={tab} onChange={setTab} />

      <div className="mt-6 space-y-6">
        <SettingsCard title={title} subtitle={subtitle}>
          {tab === "company" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SettingsField
                label="ชื่อบริษัท (ไทย)"
                required
                value={company.companyNameTH}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, companyNameTH: v },
                  }))
                }
              />

              <SettingsField
                label="ชื่อบริษัท (อังกฤษ)"
                required
                value={company.companyNameEN}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, companyNameEN: v },
                  }))
                }
              />

              <div className="md:col-span-2">
                <SettingsField
                  label="คำโปรย"
                  value={company.tagline}
                  onChange={(v) =>
                    setData((s) => ({
                      ...s,
                      company: { ...s.company, tagline: v },
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <SettingsTextArea
                  label="ที่อยู่"
                  value={company.address}
                  onChange={(v) =>
                    setData((s) => ({
                      ...s,
                      company: { ...s.company, address: v },
                    }))
                  }
                  rows={4}
                />
              </div>

              <SettingsField
                label="เลขประจำตัวผู้เสียภาษี"
                value={company.taxId}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, taxId: v },
                  }))
                }
              />

              <SettingsField
                label="เบอร์โทรศัพท์"
                value={company.phone}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, phone: v },
                  }))
                }
              />

              <SettingsField
                label="อีเมล"
                value={company.email}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, email: v },
                  }))
                }
                type="email"
              />

              <SettingsField
                label="เว็บไซต์"
                value={company.website}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, website: v },
                  }))
                }
              />
            </div>
          )}

          {tab === "banking" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SettingsField
                label="ชื่อธนาคาร"
                required
                value={banking.bankName}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, bankName: v },
                  }))
                }
              />

              <SettingsField
                label="ชื่อบัญชี"
                required
                value={banking.accountName}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, accountName: v },
                  }))
                }
              />

              <SettingsField
                label="เลขที่บัญชี"
                required
                value={banking.accountNumber}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, accountNumber: v },
                  }))
                }
              />

              <SettingsField
                label="สาขา"
                value={banking.branch}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, branch: v },
                  }))
                }
              />

              <div className="md:col-span-2">
                <SettingsField
                  label="รหัส SWIFT"
                  value={banking.swiftCode}
                  onChange={(v) =>
                    setData((s) => ({
                      ...s,
                      banking: { ...s.banking, swiftCode: v },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </SettingsCard>

        <SettingsFooter
          hasChanges={hasChanges}
          onConfirm={confirmSave}
          onReset={reset}
          saveStatus={saveStatus}
        />
      </div>

      <CompanyInfoModal
        open={isCompanyInfoOpen}
        data={data}
        onChange={setData}
        onClose={() => setIsCompanyInfoOpen(false)}
      />

      <div className="h-10" />
    </div>
  );
}

function CompanyInfoModal({
  open,
  data,
  onChange,
  onClose,
}: {
  open: boolean;
  data: SettingsState;
  onChange: React.Dispatch<React.SetStateAction<SettingsState>>;
  onClose: () => void;
}) {
  useBodyScrollLock(open);

  if (!open) return null;

  const company = data.company;
  const banking = data.banking;

  return (
    <div className="fixed inset-0 z-[220]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                เพิ่มข้อมูลบริษัท
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                กรอกข้อมูลบริษัทและข้อมูลธนาคารในครั้งเดียว
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-5">
                <div className="text-sm font-semibold text-zinc-900">
                  ข้อมูลบริษัท
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SettingsField
                    label="ชื่อบริษัท (ไทย)"
                    required
                    value={company.companyNameTH}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        company: { ...s.company, companyNameTH: v },
                      }))
                    }
                  />
                  <SettingsField
                    label="ชื่อบริษัท (อังกฤษ)"
                    required
                    value={company.companyNameEN}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        company: { ...s.company, companyNameEN: v },
                      }))
                    }
                  />
                  <div className="md:col-span-2">
                    <SettingsField
                      label="คำโปรย"
                      value={company.tagline}
                      onChange={(v) =>
                        onChange((s) => ({
                          ...s,
                          company: { ...s.company, tagline: v },
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <SettingsTextArea
                      label="ที่อยู่"
                      value={company.address}
                      onChange={(v) =>
                        onChange((s) => ({
                          ...s,
                          company: { ...s.company, address: v },
                        }))
                      }
                      rows={4}
                    />
                  </div>
                  <SettingsField
                    label="เลขประจำตัวผู้เสียภาษี"
                    value={company.taxId}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        company: { ...s.company, taxId: v },
                      }))
                    }
                  />
                  <SettingsField
                    label="เบอร์โทรศัพท์"
                    value={company.phone}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        company: { ...s.company, phone: v },
                      }))
                    }
                  />
                  <SettingsField
                    label="อีเมล"
                    value={company.email}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        company: { ...s.company, email: v },
                      }))
                    }
                    type="email"
                  />
                  <SettingsField
                    label="เว็บไซต์"
                    value={company.website}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        company: { ...s.company, website: v },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-5">
                <div className="text-sm font-semibold text-zinc-900">
                  ข้อมูลธนาคาร
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SettingsField
                    label="ชื่อธนาคาร"
                    required
                    value={banking.bankName}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        banking: { ...s.banking, bankName: v },
                      }))
                    }
                  />
                  <SettingsField
                    label="ชื่อบัญชี"
                    required
                    value={banking.accountName}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        banking: { ...s.banking, accountName: v },
                      }))
                    }
                  />
                  <SettingsField
                    label="เลขที่บัญชี"
                    required
                    value={banking.accountNumber}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        banking: { ...s.banking, accountNumber: v },
                      }))
                    }
                  />
                  <SettingsField
                    label="สาขา"
                    value={banking.branch}
                    onChange={(v) =>
                      onChange((s) => ({
                        ...s,
                        banking: { ...s.banking, branch: v },
                      }))
                    }
                  />
                  <div className="md:col-span-2">
                    <SettingsField
                      label="รหัส SWIFT"
                      value={banking.swiftCode}
                      onChange={(v) =>
                        onChange((s) => ({
                          ...s,
                          banking: { ...s.banking, swiftCode: v },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-100 p-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              ใช้ข้อมูลนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
