const full = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const short = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export const SEP = " \u00b7 ";

// "2026-11-02" -> "02 Nov 2026"
export function formatDate(iso) {
  return full.format(new Date(`${iso}T00:00:00Z`));
}

// "2026-11-16" -> "16 Nov"
export function shortDate(iso) {
  return short.format(new Date(`${iso}T00:00:00Z`));
}

export function numberWord(n) {
  return WORDS[n] ?? String(n);
}

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
