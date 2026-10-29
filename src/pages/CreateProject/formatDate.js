export function formatDate(val) {
  if (!val || typeof val !== "string") {
    return "";
  }

  const trimmed = val.trim();

  // Match ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const dayStr = String(day).padStart(2, "0");
      const monthStr = months[month];
      return `${dayStr} ${monthStr} ${year}`;
    }
  }

  // Fallback for general valid date string
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && trimmed.includes("-")) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[parsed.getMonth()];
    const year = parsed.getFullYear();
    if (day && month && year) {
      return `${day} ${month} ${year}`;
    }
  }

  // Return raw string for old saved drafts or non-ISO dates
  return trimmed;
}

