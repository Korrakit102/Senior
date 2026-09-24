export type SettingsTab = "company" | "banking";

export type CompanyInfo = {
  companyNameTH: string;
  companyNameEN: string;
  tagline: string;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  website: string;
};

export type BankingInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
};

export type CompanyProfile = {
  id: string;
  company: CompanyInfo;
  banking: BankingInfo;
};

export type SettingsState = {
  company: CompanyInfo;
  banking: BankingInfo;
  companyProfiles?: CompanyProfile[];
  activeCompanyProfileId?: string;
};
