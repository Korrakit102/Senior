import { DEFAULT_SETTINGS } from "./constants";
import type { SettingsState } from "./types";

const LEGACY_DEFAULT_VALUES = {
  companyNameTH: "EVENT STOCK MANAGER",
  tagline: "Event Equipment Rental & Management Services",
  address: "255/2 Sikan, Tha Muang, Mueang, Chiang Rai 57000",
  bankName: "Kasikornbank",
  accountName: "Event Stock Manager Co., Ltd.",
  branch: "Chiang Rai",
};

export function resetSettingsToDefault(): SettingsState {
  return DEFAULT_SETTINGS;
}

export function normalizeLegacySettings(data: SettingsState): SettingsState {
  return {
    ...data,
    company: {
      ...data.company,
      companyNameTH:
        data.company.companyNameTH === LEGACY_DEFAULT_VALUES.companyNameTH
          ? DEFAULT_SETTINGS.company.companyNameTH
          : data.company.companyNameTH,
      tagline:
        data.company.tagline === LEGACY_DEFAULT_VALUES.tagline
          ? DEFAULT_SETTINGS.company.tagline
          : data.company.tagline,
      address:
        data.company.address === LEGACY_DEFAULT_VALUES.address
          ? DEFAULT_SETTINGS.company.address
          : data.company.address,
    },
    banking: {
      ...data.banking,
      bankName:
        data.banking.bankName === LEGACY_DEFAULT_VALUES.bankName
          ? DEFAULT_SETTINGS.banking.bankName
          : data.banking.bankName,
      accountName:
        data.banking.accountName === LEGACY_DEFAULT_VALUES.accountName
          ? DEFAULT_SETTINGS.banking.accountName
          : data.banking.accountName,
      branch:
        data.banking.branch === LEGACY_DEFAULT_VALUES.branch
          ? DEFAULT_SETTINGS.banking.branch
          : data.banking.branch,
    },
  };
}

export function getSettingsTitle(tab: "company" | "banking") {
  return tab === "company" ? "ข้อมูลบริษัท" : "ข้อมูลธนาคาร";
}

export function getSettingsSubtitle(tab: "company" | "banking") {
  return tab === "company"
    ? "ข้อมูลนี้จะแสดงในเอกสารที่ระบบสร้างทั้งหมด"
    : "ใช้สำหรับรายละเอียดการชำระเงินในใบแจ้งหนี้และใบเสนอราคา";
}
