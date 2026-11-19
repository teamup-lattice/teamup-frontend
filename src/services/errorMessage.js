const DEFAULT_FALLBACK =
  "Please check the details you entered and try again.";
const DEFAULT_NETWORK_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";
const SERVER_ERROR_MESSAGE =
  "Something went wrong on our side. Try again in a moment.";
const RATE_LIMIT_MESSAGE =
  "Too many attempts. Try again in a few minutes.";

const GENERIC_MESSAGES = new Set([
  "Something went wrong",
  "Something went wrong.",
  "Invalid input",
]);

function isNetworkError(error) {
  return !error.status || error.message === "Network error";
}

function readEntry(entry) {
  if (!entry) return "";

  if (typeof entry === "string") return entry.trim();

  if (Array.isArray(entry)) {
    return entry.map(readEntry).filter(Boolean).join(" ");
  }

  if (typeof entry === "object") {
    if (typeof entry.message === "string" && entry.message.trim()) {
      return entry.message.trim();
    }

    return Object.values(entry).map(readEntry).filter(Boolean).join(" ");
  }

  return "";
}

function flattenErrors(errors) {
  return readEntry(errors);
}

export function getErrorMessage(error, overrides = {}) {
  const fallback = overrides.fallback || DEFAULT_FALLBACK;

  if (!error) return fallback;

  if (isNetworkError(error)) {
    return overrides.network || DEFAULT_NETWORK_MESSAGE;
  }

  const status = Number(error.status);

  if (overrides.byStatus?.[error.status]) {
    return overrides.byStatus[error.status];
  }

  const fieldMessage = flattenErrors(error.errors);
  if (fieldMessage) return fieldMessage;

  if (status >= 500) return SERVER_ERROR_MESSAGE;
  if (status === 429) return RATE_LIMIT_MESSAGE;

  const message =
    typeof error.message === "string" ? error.message.trim() : "";

  if (message && !GENERIC_MESSAGES.has(message)) return message;

  return fallback;
}

export function getFieldErrors(error) {
  const fieldErrors = {};
  const errors = error?.errors;

  if (!errors) return fieldErrors;

  if (Array.isArray(errors)) {
    errors.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;

      const field = entry.field;
      const message =
        typeof entry.message === "string" ? entry.message.trim() : "";

      if (field && message) fieldErrors[field] = message;
    });

    return fieldErrors;
  }

  if (typeof errors === "object") {
    Object.entries(errors).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        fieldErrors[key] = value.trim();
        return;
      }

      if (!value || typeof value !== "object") return;

      const field = value.field || key;
      const message =
        typeof value.message === "string" ? value.message.trim() : "";

      if (field && message) fieldErrors[field] = message;
    });
  }

  return fieldErrors;
}
