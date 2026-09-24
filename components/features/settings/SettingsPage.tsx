"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type {
  BankingInfo,
  CompanyInfo,
  CompanyProfile,
  SettingsState,
  SettingsTab,
} from "./types";
import {
  DEFAULT_COMPANY_PROFILE_ID,
  getSettingsSubtitle,
  getSettingsTitle,
  normalizeLegacySettings,
  resetSettingsToDefault,
  selectCompanyProfile,
  syncActiveCompanyProfile,
} from "./helpers";
import { DEFAULT_SETTINGS } from "./constants";

import SettingsHeader from "./components/SettingsHeader";
import SettingsTabs from "./components/SettingsTabs";
import SettingsCard from "./components/SettingsCard";
import SettingsField from "./components/SettingsField";
import SettingsTextArea from "./components/SettingsTextArea";
import SettingsFooter from "./components/SettingsFooter";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CompanyProfileDraft = Pick<CompanyProfile, "company" | "banking">;

const INITIAL_SETTINGS = normalizeLegacySettings(DEFAULT_SETTINGS);

function createProfileId() {
  return `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("company");
  const [data, setData] = useState<SettingsState>(INITIAL_SETTINGS);
  const [savedData, setSavedData] = useState<SettingsState>(INITIAL_SETTINGS);
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
    const payload = syncActiveCompanyProfile(data);
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      setData(payload);
      setSavedData(payload);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const reset = () => {
    const defaults = resetSettingsToDefault();
    setData(defaults);
    setSaveStatus("idle");
  };

  const updateCompanyField = (key: keyof CompanyInfo, value: string) => {
    setData((current) =>
      syncActiveCompanyProfile({
        ...current,
        company: { ...current.company, [key]: value },
      })
    );
  };

  const updateBankingField = (key: keyof BankingInfo, value: string) => {
    setData((current) =>
      syncActiveCompanyProfile({
        ...current,
        banking: { ...current.banking, [key]: value },
      })
    );
  };

  const handleSelectProfile = (profileId: string) => {
    setData((current) => selectCompanyProfile(current, profileId));
  };

  const handleDeleteProfile = (profileId: string) => {
    setData((current) => {
      const synced = syncActiveCompanyProfile(current);
      const companyProfiles = synced.companyProfiles ?? [];

      if (companyProfiles.length <= 1) return synced;

      const nextProfiles = companyProfiles.filter(
        (profile) => profile.id !== profileId
      );
      const nextActiveProfile =
        profileId === synced.activeCompanyProfileId
          ? nextProfiles[0]
          : nextProfiles.find(
              (profile) => profile.id === synced.activeCompanyProfileId
            ) ?? nextProfiles[0];

      return {
        ...synced,
        company: nextActiveProfile.company,
        banking: nextActiveProfile.banking,
        companyProfiles: nextProfiles,
        activeCompanyProfileId: nextActiveProfile.id,
      };
    });
  };

  const handleAddCompanyProfile = (profile: CompanyProfileDraft) => {
    setData((current) => {
      const synced = syncActiveCompanyProfile(current);
      const companyProfiles = synced.companyProfiles ?? [];

      return {
        ...synced,
        companyProfiles: [
          ...companyProfiles,
          {
            id: createProfileId(),
            company: profile.company,
            banking: profile.banking,
          },
        ],
      };
    });
    setIsCompanyInfoOpen(false);
  };

  const title = useMemo(() => getSettingsTitle(tab), [tab]);
  const subtitle = useMemo(() => getSettingsSubtitle(tab), [tab]);

  const company = data.company;
  const banking = data.banking;
  const profiles = data.companyProfiles ?? [];
  const activeProfileId =
    data.activeCompanyProfileId ??
    profiles[0]?.id ??
    DEFAULT_COMPANY_PROFILE_ID;

  return (
    <div className="px-6 py-8">
      <SettingsHeader onAddCompanyInfo={() => setIsCompanyInfoOpen(true)} />

      <SettingsTabs tab={tab} onChange={setTab} />

      <div className="mt-6 space-y-6">
        <CompanyProfilePicker
          activeProfileId={activeProfileId}
          profiles={profiles}
          onDelete={handleDeleteProfile}
          onSelect={handleSelectProfile}
        />

        <SettingsCard title={title} subtitle={subtitle}>
          {tab === "company" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SettingsField
                label="ชื่อบริษัท (ไทย)"
                required
                value={company.companyNameTH}
                onChange={(v) => updateCompanyField("companyNameTH", v)}
              />

              <SettingsField
                label="ชื่อบริษัท (อังกฤษ)"
                required
                value={company.companyNameEN}
                onChange={(v) => updateCompanyField("companyNameEN", v)}
              />

              <div className="md:col-span-2">
                <SettingsField
                  label="คำโปรย"
                  value={company.tagline}
                  onChange={(v) => updateCompanyField("tagline", v)}
                />
              </div>

              <div className="md:col-span-2">
                <SettingsTextArea
                  label="ที่อยู่"
                  value={company.address}
                  onChange={(v) => updateCompanyField("address", v)}
                  rows={4}
                />
              </div>

              <SettingsField
                label="เลขประจำตัวผู้เสียภาษี"
                value={company.taxId}
                onChange={(v) => updateCompanyField("taxId", v)}
              />

              <SettingsField
                label="เบอร์โทรศัพท์"
                value={company.phone}
                onChange={(v) => updateCompanyField("phone", v)}
              />

              <SettingsField
                label="อีเมล"
                value={company.email}
                onChange={(v) => updateCompanyField("email", v)}
                type="email"
              />

              <SettingsField
                label="เว็บไซต์"
                value={company.website}
                onChange={(v) => updateCompanyField("website", v)}
              />
            </div>
          )}

          {tab === "banking" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SettingsField
                label="ชื่อธนาคาร"
                required
                value={banking.bankName}
                onChange={(v) => updateBankingField("bankName", v)}
              />

              <SettingsField
                label="ชื่อบัญชี"
                required
                value={banking.accountName}
                onChange={(v) => updateBankingField("accountName", v)}
              />

              <SettingsField
                label="เลขที่บัญชี"
                required
                value={banking.accountNumber}
                onChange={(v) => updateBankingField("accountNumber", v)}
              />

              <SettingsField
                label="สาขา"
                value={banking.branch}
                onChange={(v) => updateBankingField("branch", v)}
              />

              <div className="md:col-span-2">
                <SettingsField
                  label="รหัส SWIFT"
                  value={banking.swiftCode}
                  onChange={(v) => updateBankingField("swiftCode", v)}
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

      {isCompanyInfoOpen && (
        <CompanyInfoModal
          template={data}
          onAddProfile={handleAddCompanyProfile}
          onClose={() => setIsCompanyInfoOpen(false)}
        />
      )}

      <div className="h-10" />
    </div>
  );
}

function CompanyProfilePicker({
  profiles,
  activeProfileId,
  onDelete,
  onSelect,
}: {
  profiles: CompanyProfile[];
  activeProfileId: string;
  onDelete: (profileId: string) => void;
  onSelect: (profileId: string) => void;
}) {
  if (profiles.length === 0) return null;

  return (
    <SettingsCard
      title="เลือกข้อมูลบริษัท"
      subtitle="ชุดที่เลือกจะถูกใช้ในใบเสนอราคา ใบแจ้งหนี้ ใบแจ้งหนี้ความเสียหาย และเอกสารอื่นของระบบ"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;

          return (
            <div
              key={profile.id}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-red-200 bg-red-50 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">
                    {profile.company.companyNameTH || "ไม่มีชื่อบริษัท"}
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-500">
                    {profile.banking.bankName || "ไม่มีธนาคาร"}
                    {profile.banking.accountNumber
                      ? ` · ${profile.banking.accountNumber}`
                      : ""}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isActive && (
                    <CheckCircle2 className="h-5 w-5 text-red-600" />
                  )}
                  {profiles.length > 1 && (
                    <button
                      type="button"
                      aria-label="ลบข้อมูลบริษัท"
                      onClick={() => onDelete(profile.id)}
                      className="grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isActive}
                onClick={() => onSelect(profile.id)}
                className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {isActive ? "กำลังใช้งาน" : "เลือกใช้"}
              </button>
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}

function CompanyInfoModal({
  template,
  onAddProfile,
  onClose,
}: {
  template: SettingsState;
  onAddProfile: (profile: CompanyProfileDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SettingsState>(() =>
    normalizeLegacySettings(template)
  );

  useBodyScrollLock(true);

  const updateDraftCompanyField = (key: keyof CompanyInfo, value: string) => {
    setDraft((current) =>
      syncActiveCompanyProfile({
        ...current,
        company: { ...current.company, [key]: value },
      })
    );
  };

  const updateDraftBankingField = (key: keyof BankingInfo, value: string) => {
    setDraft((current) =>
      syncActiveCompanyProfile({
        ...current,
        banking: { ...current.banking, [key]: value },
      })
    );
  };

  const company = draft.company;
  const banking = draft.banking;
  const canSubmit = Boolean(
    company.companyNameTH.trim() &&
      company.companyNameEN.trim() &&
      banking.bankName.trim() &&
      banking.accountName.trim() &&
      banking.accountNumber.trim()
  );

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
                      updateDraftCompanyField("companyNameTH", v)
                    }
                  />
                  <SettingsField
                    label="ชื่อบริษัท (อังกฤษ)"
                    required
                    value={company.companyNameEN}
                    onChange={(v) =>
                      updateDraftCompanyField("companyNameEN", v)
                    }
                  />
                  <div className="md:col-span-2">
                    <SettingsField
                      label="คำโปรย"
                      value={company.tagline}
                      onChange={(v) => updateDraftCompanyField("tagline", v)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <SettingsTextArea
                      label="ที่อยู่"
                      value={company.address}
                      onChange={(v) => updateDraftCompanyField("address", v)}
                      rows={4}
                    />
                  </div>
                  <SettingsField
                    label="เลขประจำตัวผู้เสียภาษี"
                    value={company.taxId}
                    onChange={(v) => updateDraftCompanyField("taxId", v)}
                  />
                  <SettingsField
                    label="เบอร์โทรศัพท์"
                    value={company.phone}
                    onChange={(v) => updateDraftCompanyField("phone", v)}
                  />
                  <SettingsField
                    label="อีเมล"
                    value={company.email}
                    onChange={(v) => updateDraftCompanyField("email", v)}
                    type="email"
                  />
                  <SettingsField
                    label="เว็บไซต์"
                    value={company.website}
                    onChange={(v) => updateDraftCompanyField("website", v)}
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
                    onChange={(v) => updateDraftBankingField("bankName", v)}
                  />
                  <SettingsField
                    label="ชื่อบัญชี"
                    required
                    value={banking.accountName}
                    onChange={(v) => updateDraftBankingField("accountName", v)}
                  />
                  <SettingsField
                    label="เลขที่บัญชี"
                    required
                    value={banking.accountNumber}
                    onChange={(v) =>
                      updateDraftBankingField("accountNumber", v)
                    }
                  />
                  <SettingsField
                    label="สาขา"
                    value={banking.branch}
                    onChange={(v) => updateDraftBankingField("branch", v)}
                  />
                  <div className="md:col-span-2">
                    <SettingsField
                      label="รหัส SWIFT"
                      value={banking.swiftCode}
                      onChange={(v) => updateDraftBankingField("swiftCode", v)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-100 p-5">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                onAddProfile({
                  company,
                  banking,
                })
              }
              className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              เพิ่มข้อมูลบริษัท
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
