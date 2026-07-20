import type { SettingsState } from "./types";

export const STORAGE_KEY = "event_stock_manager_settings_v1";

export const DEFAULT_SETTINGS: SettingsState = {
  company: {
    companyNameTH: "บริษัท อีเวนต์ สต็อก เมเนเจอร์ จำกัด",
    companyNameEN: "Event Stock Manager Co., Ltd.",
    tagline: "บริการเช่าและจัดการอุปกรณ์อีเวนต์",
    address: "255/2 สีกัน, ท่าม่วง, เมือง, เชียงราย 57000",
    taxId: "0575559000545",
    phone: "095-145-8088",
    email: "info@eventstock.com",
    website: "www.eventstock.com",
  },
  banking: {
    bankName: "ธนาคารกสิกรไทย",
    accountName: "บริษัท อีเวนต์ สต็อก เมเนเจอร์ จำกัด",
    accountNumber: "xxx-x-xxxxx-x",
    branch: "เชียงราย",
    swiftCode: "KASITHBK",
  },
};
