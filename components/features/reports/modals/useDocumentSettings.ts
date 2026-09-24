"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS } from "../../settings/constants";
import { normalizeLegacySettings } from "../../settings/helpers";
import type { SettingsState } from "../../settings/types";

export type DocumentSettings = {
  companyName: string;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
  bankLine: string;
};

function toDocumentSettings(settings: SettingsState): DocumentSettings {
  const bankLineParts = [
    settings.banking.bankName,
    settings.banking.branch ? `สาขา${settings.banking.branch}` : "",
  ].filter(Boolean);

  return {
    companyName: settings.company.companyNameTH,
    address: settings.company.address,
    taxId: settings.company.taxId,
    phone: settings.company.phone,
    email: settings.company.email,
    bankName: settings.banking.bankName,
    accountName: settings.banking.accountName,
    accountNumber: settings.banking.accountNumber,
    branch: settings.banking.branch,
    swiftCode: settings.banking.swiftCode,
    bankLine: bankLineParts.join(" "),
  };
}

export function useDocumentSettings(active: boolean): DocumentSettings {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("failed to load settings");
        const json = await res.json();
        if (!cancelled && json?.company && json?.banking) {
          setSettings(normalizeLegacySettings(json as SettingsState));
        }
      } catch {
        if (!cancelled) setSettings(DEFAULT_SETTINGS);
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [active]);

  return useMemo(() => toDocumentSettings(settings), [settings]);
}
