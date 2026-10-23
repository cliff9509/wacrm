import { BRAND } from "@/lib/brand";

export const KENYA_LOCALE = BRAND.locale;
export const KENYA_TIMEZONE = BRAND.timezone;

/** Format UTC timestamps for CRM display without changing persisted values. */
export function formatKenyanDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(KENYA_LOCALE, {
    timeZone: KENYA_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric", ...options,
  }).format(new Date(value));
}

export function formatKenyanDateTime(value: string | Date) {
  return new Intl.DateTimeFormat(KENYA_LOCALE, {
    timeZone: KENYA_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
