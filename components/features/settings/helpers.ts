import { DEFAULT_SETTINGS } from "./constants";
import type {
  BankingInfo,
  CompanyInfo,
  CompanyProfile,
  SettingsState,
} from "./types";

export const DEFAULT_COMPANY_PROFILE_ID = "default-company";

const LEGACY_DEFAULT_VALUES = {
  companyNameTH: "EVENT STOCK MANAGER",
  tagline: "Event Equipment Rental & Management Services",
  address: "255/2 Sikan, Tha Muang, Mueang, Chiang Rai 57000",
  bankName: "Kasikornbank",
  accountName: "Event Stock Manager Co., Ltd.",
  branch: "Chiang Rai",
};

export function resetSettingsToDefault(): SettingsState {
  return normalizeLegacySettings(DEFAULT_SETTINGS);
}

function normalizeCompanyInfo(company: Partial<CompanyInfo> = {}): CompanyInfo {
  const merged = {
    ...DEFAULT_SETTINGS.company,
    ...company,
  };

  return {
    ...merged,
    companyNameTH:
      merged.companyNameTH === LEGACY_DEFAULT_VALUES.companyNameTH
        ? DEFAULT_SETTINGS.company.companyNameTH
        : merged.companyNameTH,
    tagline:
      merged.tagline === LEGACY_DEFAULT_VALUES.tagline
        ? DEFAULT_SETTINGS.company.tagline
        : merged.tagline,
    address:
      merged.address === LEGACY_DEFAULT_VALUES.address
        ? DEFAULT_SETTINGS.company.address
        : merged.address,
  };
}

function normalizeBankingInfo(banking: Partial<BankingInfo> = {}): BankingInfo {
  const merged = {
    ...DEFAULT_SETTINGS.banking,
    ...banking,
  };

  return {
    ...merged,
    bankName:
      merged.bankName === LEGACY_DEFAULT_VALUES.bankName
        ? DEFAULT_SETTINGS.banking.bankName
        : merged.bankName,
    accountName:
      merged.accountName === LEGACY_DEFAULT_VALUES.accountName
        ? DEFAULT_SETTINGS.banking.accountName
        : merged.accountName,
    branch:
      merged.branch === LEGACY_DEFAULT_VALUES.branch
        ? DEFAULT_SETTINGS.banking.branch
        : merged.branch,
  };
}

function normalizeProfiles(
  data: SettingsState,
  fallbackCompany: CompanyInfo,
  fallbackBanking: BankingInfo
): CompanyProfile[] {
  const source =
    Array.isArray(data.companyProfiles) && data.companyProfiles.length > 0
      ? data.companyProfiles
      : [
          {
            id: data.activeCompanyProfileId || DEFAULT_COMPANY_PROFILE_ID,
            company: fallbackCompany,
            banking: fallbackBanking,
          },
        ];

  return source.map((profile, index) => ({
    id:
      profile.id ||
      (index === 0 ? DEFAULT_COMPANY_PROFILE_ID : `company-${index + 1}`),
    company: normalizeCompanyInfo(profile.company ?? fallbackCompany),
    banking: normalizeBankingInfo(profile.banking ?? fallbackBanking),
  }));
}

function resolveActiveProfileId(
  profiles: CompanyProfile[],
  activeCompanyProfileId?: string
) {
  return profiles.some((profile) => profile.id === activeCompanyProfileId)
    ? activeCompanyProfileId
    : profiles[0]?.id;
}

export function normalizeLegacySettings(data: SettingsState): SettingsState {
  const fallbackCompany = normalizeCompanyInfo(data.company);
  const fallbackBanking = normalizeBankingInfo(data.banking);
  const companyProfiles = normalizeProfiles(data, fallbackCompany, fallbackBanking);
  const activeCompanyProfileId = resolveActiveProfileId(
    companyProfiles,
    data.activeCompanyProfileId
  );
  const activeProfile =
    companyProfiles.find((profile) => profile.id === activeCompanyProfileId) ??
    companyProfiles[0];

  return {
    ...data,
    company: activeProfile.company,
    banking: activeProfile.banking,
    companyProfiles,
    activeCompanyProfileId,
  };
}

export function syncActiveCompanyProfile(data: SettingsState): SettingsState {
  const company = normalizeCompanyInfo(data.company);
  const banking = normalizeBankingInfo(data.banking);
  const companyProfiles = normalizeProfiles(data, company, banking);
  const activeCompanyProfileId = resolveActiveProfileId(
    companyProfiles,
    data.activeCompanyProfileId
  );

  return {
    ...data,
    company,
    banking,
    companyProfiles: companyProfiles.map((profile) =>
      profile.id === activeCompanyProfileId
        ? { ...profile, company, banking }
        : profile
    ),
    activeCompanyProfileId,
  };
}

export function selectCompanyProfile(
  data: SettingsState,
  profileId: string
): SettingsState {
  const synced = syncActiveCompanyProfile(data);
  const activeProfile = synced.companyProfiles?.find(
    (profile) => profile.id === profileId
  );

  if (!activeProfile) return synced;

  return {
    ...synced,
    company: activeProfile.company,
    banking: activeProfile.banking,
    activeCompanyProfileId: activeProfile.id,
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
