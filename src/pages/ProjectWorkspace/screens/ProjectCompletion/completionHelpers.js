import { SEP, formatDate, shortDate } from "../../workspaceFormat";
import { api } from "../../../../services/api";
import { getCompletion } from "../../../../services/completionService";
import { getProjectEvidence } from "../../../../services/evidenceService";
import { getProjectContributions } from "../../../../services/contributionsService";

export const APOS = "’";
// Visibility facts shown after completion. A completed project page is always
// private and team-only; sharing is a separate choice (Sharing and privacy).
export const VISIBILITY = "PRIVATE";
export const AUDIENCE = "Team-only";

export function listText(items) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "30 Nov 2026 · 19 Oct–30 Nov · 6 weeks"
function toDateInput(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? ""
    : new Date(timestamp).toISOString().slice(0, 10);
}

export function projectDatesLine(project = {}) {
  const startDate = toDateInput(project.startDate);
  const endDate = toDateInput(project.endDate);
  const durationWeeks =
    typeof project.durationWeeks === "number" &&
    Number.isFinite(project.durationWeeks)
      ? project.durationWeeks
      : null;
  const parts = [];

  if (endDate) parts.push(formatDate(endDate));
  if (startDate && endDate) {
    parts.push(`${shortDate(startDate)}–${shortDate(endDate)}`);
  }
  if (durationWeeks !== null) {
    parts.push(
      `${durationWeeks} ${durationWeeks === 1 ? "week" : "weeks"}`,
    );
  }

  return parts.join(SEP);
}

// Saved work for the completion screen, derived from real milestones and
// tasks. Tasks are matched by milestone id (never by name).
export function buildSavedWork(milestones, tasks) {
  const milestoneList = Array.isArray(milestones) ? milestones : [];
  const taskList = Array.isArray(tasks) ? tasks : [];

  return milestoneList.map((milestone) => {
    const milestoneTasks = taskList.filter(
      (task) => String(task.milestoneId) === String(milestone.id),
    );

    return {
      id: milestone.id,
      name: milestone.name,
      targetDate: milestone.targetDate,
      done: milestoneTasks.filter((task) => task.status === "Done").length,
      total: milestoneTasks.length,
    };
  });
}

// What is saved and what still blocks completion.
export function getReadiness(
  evidence,
  confirmations,
  contributions = [],
  tasks = [],
) {
  if (typeof evidence === "string") {
    const projectId = evidence;
    return Promise.all([
      getProjectEvidence(projectId).catch(() => null),
      getCompletion(projectId).catch(() => ({ confirmations: [] })),
      getProjectContributions(projectId).catch(() => []),
      api
        .get(`/api/projects/${encodeURIComponent(projectId)}/tasks`)
        .catch(() => ({ tasks: [] })),
    ]).then(([evidenceData, completionData, contribsData, tasksData]) => {
      const rawTasks = Array.isArray(tasksData)
        ? tasksData
        : Array.isArray(tasksData?.tasks)
          ? tasksData.tasks
          : [];
      return getReadiness(
        evidenceData,
        completionData?.confirmations ?? [],
        contribsData,
        rawTasks,
      );
    });
  }

  if (typeof tasks === "string") {
    const projectId = tasks;
    return api
      .get(`/api/projects/${encodeURIComponent(projectId)}/tasks`)
      .catch(() => ({ tasks: [] }))
      .then((tasksData) => {
        const rawTasks = Array.isArray(tasksData)
          ? tasksData
          : Array.isArray(tasksData?.tasks)
            ? tasksData.tasks
            : [];
        return getReadiness(evidence, confirmations, contributions, rawTasks);
      });
  }

  const hasOutcome = evidence?.outcome ? evidence.outcome.trim() !== "" : false;
  const hasDeliverable = Boolean(evidence?.deliverable);
  const confirmed = (confirmations || []).filter((item) => item.confirmedBy);
  const pending = (confirmations || []).filter((item) => !item.confirmedBy);
  const evidenceComplete = hasOutcome && hasDeliverable;
  const allConfirmed = (confirmations || []).length > 0 && pending.length === 0;

  const contributionList = Array.isArray(contributions) ? contributions : [];
  const pendingContributions = contributionList.filter(
    (item) => item.status !== "CONFIRMED",
  );
  const allContributionsConfirmed = pendingContributions.length === 0;

  const taskList = Array.isArray(tasks) ? tasks : [];
  const openTasks = taskList.filter((task) => {
    const status = task?.status;
    return status !== "Done" && status !== "COMPLETED";
  });
  const allTasksDone = openTasks.length === 0;

  return {
    hasOutcome,
    hasDeliverable,
    confirmed,
    pending,
    total: (confirmations || []).length,
    evidenceComplete,
    allConfirmed,
    pendingContributions,
    allContributionsConfirmed,
    openTasks,
    allTasksDone,
    eligible:
      evidenceComplete &&
      allConfirmed &&
      allContributionsConfirmed &&
      allTasksDone,
  };
}

export function deliverableKindLabel(kind) {
  return kind === "link" ? "Link" : "File";
}

// "Ada confirmed by John · John confirmed by Ada · David confirmed by John, 30 Nov 2026."
export function confirmationsLine(confirmations) {
  const parts = confirmations.map(
    (item) => `${item.member} confirmed by ${item.confirmedBy}`,
  );
  const dates = confirmations
    .map((item) => item.confirmedOn)
    .filter(Boolean)
    .sort();
  const latest = dates[dates.length - 1];
  return `${parts.join(SEP)}${latest ? `, ${formatDate(latest)}` : ""}.`;
}
