import { api } from "./api";

const HEALTH_STATUSES = new Set(["ON_TRACK", "NEEDS_ATTENTION", "AT_RISK"]);
const ENUM_LIKE = /^[A-Z][A-Z0-9_]*$/;

function toCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function toOptionalNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeReasons(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((reason) => typeof reason === "string")
    .map((reason) => reason.trim())
    .filter((reason) => reason !== "" && !ENUM_LIKE.test(reason));
}

export function normalizeTeamHealth(value) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const status =
    typeof source.status === "string" ? source.status.toUpperCase() : "";
  if (!HEALTH_STATUSES.has(status) && import.meta.env.DEV) {
    console.warn("Unrecognized team health response shape:", value);
  }
  const signals =
    source.signals &&
    typeof source.signals === "object" &&
    !Array.isArray(source.signals)
      ? source.signals
      : {};

  return {
    status: HEALTH_STATUSES.has(status) ? status : "UNKNOWN",
    reasons: normalizeReasons(source.reasons),
    signals: {
      overdueTasks: toCount(signals.overdueTasks),
      blockedTasks: toCount(signals.blockedTasks),
      tasksAwaitingReview: toCount(signals.tasksAwaitingReview),
      overdueMilestones: toCount(signals.overdueMilestones),
      inactiveMembers: Array.isArray(signals.inactiveMembers)
        ? signals.inactiveMembers
        : [],
      lastUpdateAt:
        typeof signals.lastUpdateAt === "string" ? signals.lastUpdateAt : null,
      checkInIntervalDays: toOptionalNumber(signals.checkInIntervalDays),
      inactivityDays: toOptionalNumber(signals.inactivityDays),
      reviewStaleDays: toOptionalNumber(signals.reviewStaleDays),
    },
  };
}

export async function getProjectHealth(projectId) {
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/health`,
  );
  return normalizeTeamHealth(response?.teamHealth ?? response);
}
