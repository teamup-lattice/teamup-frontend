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

  const assigneeRelation =
    task.assignee && typeof task.assignee === "object"
      ? task.assignee
      : null;
  const assigneeMemberId =
    task.assigneeMemberId ?? assigneeRelation?.id ?? null;
  const member = memberships.find(
    (item) => String(item.id) === String(assigneeMemberId),
  );
  const milestoneRelation =
    task.milestone && typeof task.milestone === "object"
      ? task.milestone
      : null;
  const milestoneId = task.milestoneId ?? milestoneRelation?.id ?? "";
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
    assignee:
      member?.name ??
      (typeof assigneeRelation?.user?.name === "string"
        ? assigneeRelation.user.name
        : typeof assigneeRelation?.name === "string"
          ? assigneeRelation.name
          : typeof task.assignee === "string"
            ? task.assignee
            : "Unassigned"),
    assigneeMemberId:
      typeof assigneeMemberId === "string" ||
      typeof assigneeMemberId === "number"
        ? assigneeMemberId
        : "",
    dueDate,
    milestoneId,
    milestoneName:
      milestone?.name ??
      (typeof milestoneRelation?.title === "string"
        ? milestoneRelation.title
        : ""),
    status,
    note: typeof task.description === "string" ? task.description : "",
    blockerNote: typeof task.blockerNote === "string" ? task.blockerNote : "",
    description:
      typeof task.description === "string" ? task.description : "",
    priority: typeof task.priority === "string" ? task.priority : "",
    estimatedHours:
      Number.isInteger(task.estimatedHours) ? task.estimatedHours : null,
    sortOrder: Number.isInteger(task.sortOrder) ? task.sortOrder : null,
    overdueDays: getOverdueDays(dueDate, status),
  };
}

function mapContribution(contribution) {
  if (
    !contribution ||
    typeof contribution !== "object" ||
    Array.isArray(contribution)
  ) {
    throw new Error("Task response contains invalid contribution data.");
  }

  return {
    id:
      typeof contribution.id === "string" ||
      typeof contribution.id === "number"
        ? contribution.id
        : "",
    title:
      typeof contribution.title === "string" ? contribution.title : "",
    completionNote:
      typeof contribution.completionNote === "string"
        ? contribution.completionNote
        : "",
    artifactUrl:
      typeof contribution.artifactUrl === "string"
        ? contribution.artifactUrl
        : "",
    fileUrl:
      typeof contribution.fileUrl === "string" ? contribution.fileUrl : "",
    fileType:
      typeof contribution.fileType === "string" ? contribution.fileType : "",
    evidence: Array.isArray(contribution.evidence)
      ? contribution.evidence
      : [],
  };
}

function mapComment(comment) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) {
    throw new Error("Comments response contains invalid comment data.");
  }

  const createdAt =
    typeof comment.createdAt === "string" ? comment.createdAt : "";
  const timestamp = Date.parse(createdAt);

  return {
    id:
      typeof comment.id === "string" || typeof comment.id === "number"
        ? comment.id
        : "",
    author:
      typeof comment.author?.name === "string"
        ? comment.author.name
        : typeof comment.author?.user?.name === "string"
          ? comment.author.user.name
          : "",
    date: Number.isNaN(timestamp)
      ? ""
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(timestamp),
    message: typeof comment.content === "string" ? comment.content : "",
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

export async function getProjectTask(projectId, taskId, options = {}) {
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
  );
  const task = response?.task ?? response;
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    throw new Error("Task response is missing task data.");
  }

  const mapped = mapTask(
    task,
    options.memberships ?? [],
    options.milestones ?? [],
  );
  mapped.createdBy =
    typeof task.createdBy?.name === "string"
      ? task.createdBy.name
      : typeof task.createdBy?.user?.name === "string"
        ? task.createdBy.user.name
        : "";
  mapped.contributions = Array.isArray(task.contributions)
    ? task.contributions.map(mapContribution)
    : [];
  return mapped;
}

export async function getProjectTaskComments(projectId, taskId) {
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`,
  );
  const comments = Array.isArray(response) ? response : response?.comments;
  if (!Array.isArray(comments)) {
    throw new Error("Comments response is missing comments.");
  }
  return comments.map(mapComment);
}

export function updateProjectTask(projectId, taskId, changes) {
  return api.patch(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    changes,
  );
}

export function deleteProjectTask(projectId, taskId) {
  return api.delete(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
  );
}

export function createProjectTaskComment(projectId, taskId, content) {
  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`,
    { content },
  );
}

export function updateProjectTaskComment(projectId, taskId, commentId, content) {
  return api.patch(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
    { content },
  );
}

export function deleteProjectTaskComment(projectId, taskId, commentId) {
  return api.delete(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
  );
}
