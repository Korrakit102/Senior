import { DEFAULT_SETTINGS } from "./constants";
import type { SettingsState } from "./types";

export function resetSettingsToDefault(): SettingsState {
  return DEFAULT_SETTINGS;
}

export function getSettingsTitle(tab: "company" | "banking") {
  return tab === "company" ? "Company Information" : "Banking Information";
}

export function getSettingsSubtitle(tab: "company" | "banking") {
  return tab === "company"
    ? "This information will appear on all generated documents"
    : "Used for invoices / quotations payment details";
}