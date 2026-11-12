import { api } from "./api";

const API_TO_UI_STATUS = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In review",
  COMPLETED: "Done",
  CANCELLED: "Cancelled",
};

const UI_TO_API_STATUS = Object.fromEntries(
  Object.entries(API_TO_UI_STATUS).map(([apiStatus, uiStatus]) => [
    uiStatus,
    apiStatus,
  ]),
);

export const taskStatusOptions = Object.entries(API_TO_UI_STATUS)
  .filter(([status]) => status !== "CANCELLED")
  .map(([value, label]) => ({ value, label }));

export function getTaskApiStatus(value) {
  return UI_TO_API_STATUS[value] ?? value;
}

function toDateInput(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? ""
    : new Date(timestamp).toISOString().slice(0, 10);
}

function getOverdueDays(dueDate, status) {
  if (!dueDate || status === "Done" || status === "Cancelled") return 0;
  const due = new Date(`${dueDate}T00:00:00.000Z`);
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return Math.max(0, Math.floor((todayUtc - due.getTime()) / 86400000));
}

function mapTask(task, memberships, milestones) {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    throw new Error("Tasks response contains invalid task data.");
  }

  const assigneeMemberId = task.assigneeMemberId ?? null;
  const member = memberships.find(
    (item) => String(item.id) === String(assigneeMemberId),
  );
  const milestoneId = task.milestoneId ?? "";
  const milestone = milestones.find(
    (item) => String(item.id) === String(milestoneId),
  );
  const apiStatus =
    typeof task.status === "string" ? task.status.toUpperCase() : "";
  const status =
    API_TO_UI_STATUS[apiStatus] ??
    (typeof task.status === "string" ? task.status : "To do");
  const dueDate = toDateInput(task.dueDate);

  return {
    id:
      typeof task.id === "string" || typeof task.id === "number"
        ? task.id
        : "",
    title: typeof task.title === "string" ? task.title : "",
    assignee: member?.name ?? "Unassigned",
    assigneeMemberId:
      typeof assigneeMemberId === "string" ||
      typeof assigneeMemberId === "number"
        ? assigneeMemberId
        : "",
    dueDate,
    milestoneId,
    milestoneName: milestone?.name ?? "",
    status,
    note: typeof task.description === "string" ? task.description : "",
    blockerNote: "",
    overdueDays: getOverdueDays(dueDate, status),
  };
}

function normalizeSummary(summary) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    throw new Error("Tasks response is missing summary data.");
  }

  const count = (value, field) => {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Tasks response contains an invalid ${field} count.`);
    }
    return value;
  };

  return {
    total: count(summary.total, "total"),
    done: count(summary.done, "done"),
    notDone: count(summary.notDone, "not-done"),
    overdue: count(summary.overdue, "overdue"),
  };
}

function normalizePagination(pagination, taskCount) {
  const page =
    Number.isInteger(pagination?.page) && pagination.page > 0
      ? pagination.page
      : 1;
  const totalPages =
    Number.isInteger(pagination?.totalPages) && pagination.totalPages >= page
      ? pagination.totalPages
      : page;

  return { page, totalPages, taskCount };
}

function buildTaskPath(projectId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set(
      "status",
      UI_TO_API_STATUS[filters.status] ?? filters.status,
    );
  }
  if (filters.milestoneId) {
    params.set("milestoneId", String(filters.milestoneId));
  }
  if (filters.assigneeMemberId) {
    params.set("assigneeMemberId", String(filters.assigneeMemberId));
  }
  if (filters.mine === true) params.set("mine", "true");
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(Math.min(filters.limit ?? 100, 100)));

  return `/api/projects/${encodeURIComponent(projectId)}/tasks?${params}`;
}

export async function getProjectTasks(
  projectId,
  filters = {},
  { memberships = [], milestones = [] } = {},
) {
  const response = await api.get(buildTaskPath(projectId, filters));
  if (!Array.isArray(response?.tasks)) {
    throw new Error("Tasks response is missing tasks.");
  }

  const tasks = response.tasks.map((task) =>
    mapTask(task, memberships, milestones),
  );
  return {
    tasks,
    summary: normalizeSummary(response.summary),
    pagination: normalizePagination(response.pagination, tasks.length),
  };
}

export async function getAllProjectTasks(
  projectId,
  filters = {},
  { memberships = [], milestones = [] } = {},
) {
  const firstPage = await getProjectTasks(
    projectId,
    { ...filters, page: 1, limit: 100 },
    { memberships, milestones },
  );
  const allTasks = [...firstPage.tasks];

  for (
    let page = firstPage.pagination.page + 1;
    page <= firstPage.pagination.totalPages;
    page += 1
  ) {
    const result = await getProjectTasks(
      projectId,
      { ...filters, page, limit: 100 },
      { memberships, milestones },
    );
    allTasks.push(...result.tasks);
  }

  return { ...firstPage, tasks: allTasks };
}

export function createProjectTask(projectId, task) {
  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/tasks`,
    task,
  );
}
