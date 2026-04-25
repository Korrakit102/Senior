"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { SettingsState, SettingsTab } from "./types";
import { getSettingsSubtitle, getSettingsTitle, resetSettingsToDefault } from "./helpers";
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as SettingsState;
        if (json?.company && json?.banking) setData(json);
      } catch {
        // keep DEFAULT_SETTINGS
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (isLoading) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("failed");
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, isLoading]);

  const reset = async () => {
    const defaults = resetSettingsToDefault();
    setData(defaults);
  };

  const title = useMemo(() => getSettingsTitle(tab), [tab]);
  const subtitle = useMemo(() => getSettingsSubtitle(tab), [tab]);

  const company = data.company;
  const banking = data.banking;

  return (
    <div className="px-6 py-8">
      <SettingsHeader />

      <SettingsTabs tab={tab} onChange={setTab} />

      <div className="mt-6 space-y-6">
        <SettingsCard title={title} subtitle={subtitle}>
          {tab === "company" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SettingsField
                label="Company Name (TH)"
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
                label="Company Name (EN)"
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
                  label="Tagline"
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
                  label="Address"
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
                label="Tax ID"
                value={company.taxId}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, taxId: v },
                  }))
                }
              />

              <SettingsField
                label="Phone"
                value={company.phone}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, phone: v },
                  }))
                }
              />

              <SettingsField
                label="Email"
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
                label="Website"
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
                label="Bank Name"
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
                label="Account Name"
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
                label="Account Number"
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
                label="Branch"
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
                  label="SWIFT Code"
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

        <SettingsFooter onReset={reset} saveStatus={saveStatus} />
      </div>

      <div className="h-10" />
    </div>
  );
}