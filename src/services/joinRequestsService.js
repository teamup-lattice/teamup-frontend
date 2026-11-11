import { api } from "./api";

const REQUEST_STATUS_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Approved",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readableLabel(value) {
  const label = String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function mapSkills(skills, levelKey) {
  return (Array.isArray(skills) ? skills : [])
    .map((item) => {
      const name = item?.skill?.name;
      if (!name) return "";
      if (!levelKey || !item[levelKey]) return name;
      return `${name} · ${readableLabel(item[levelKey])}`;
    })
    .filter(Boolean);
}

function mapListRequest(request) {
  return {
    id: request.id,
    status: request.status,
    statusLabel: REQUEST_STATUS_LABELS[request.status] ?? readableLabel(request.status),
    message: request.message ?? "",
    proposedHoursPerWeek: request.proposedHoursPerWeek ?? null,
    plannedTaskDeadlines: request.plannedTaskDeadlines ?? "",
    createdAt: formatDate(request.createdAt),
    requester: {
      id: request.requester?.id,
      name: request.requester?.name ?? "",
      avatarUrl: request.requester?.avatarUrl ?? "",
      headline: request.requester?.headline ?? "",
    },
    role: {
      id: request.role?.id,
      title: request.role?.title ?? "",
    },
  };
}

function mapJoinRequest(request) {
  const project = request.project ?? {};
  const role = request.role ?? {};
  const requester = request.requester ?? {};
  const durationWeeks = project.durationWeeks ?? null;

  return {
    id: request.id,
    status: request.status,
    statusLabel: REQUEST_STATUS_LABELS[request.status] ?? readableLabel(request.status),
    message: request.message ?? "",
    decisionNote: request.decisionNote ?? "",
    proposedHoursPerWeek: request.proposedHoursPerWeek ?? null,
    plannedTaskDeadlines: request.plannedTaskDeadlines ?? "",
    createdAt: formatDate(request.createdAt),
    reviewedAt: formatDate(request.reviewedAt),
    requester: {
      id: requester.id,
      name: requester.name ?? "",
      avatarUrl: requester.avatarUrl ?? "",
      headline: requester.headline ?? "",
      bio: requester.bio ?? "",
      goals: requester.goals ?? "",
      isAvailable: requester.isAvailable ?? null,
      weeklyAvailabilityHours: requester.weeklyAvailabilityHours ?? null,
      availability:
        requester.weeklyAvailabilityHours == null
          ? ""
          : `${requester.weeklyAvailabilityHours} ${
              requester.weeklyAvailabilityHours === 1 ? "hr" : "hrs"
            }/week`,
      preferredProjectDurationWeeks:
        requester.preferredProjectDurationWeeks ?? null,
      preferredDuration:
        requester.preferredProjectDurationWeeks == null
          ? ""
          : `${requester.preferredProjectDurationWeeks} ${
              requester.preferredProjectDurationWeeks === 1 ? "week" : "weeks"
            }`,
      skills: mapSkills(requester.skills, "level"),
    },
    project: {
      id: project.id,
      title: project.title ?? "",
      name: project.title ?? "",
      description: project.description ?? "",
      problem: project.problem ?? "",
      outcome: project.outcome ?? "",
      expectedOutcome: project.outcome ?? "",
      projectType: project.projectType ?? "",
      type: readableLabel(project.projectType),
      status: project.status ?? "",
      statusLabel: readableLabel(project.status),
      durationWeeks,
      weeklyHours: project.weeklyHours ?? null,
      startDate: formatDate(project.startDate),
      targetEndDate: formatDate(project.targetEndDate),
      endDate: formatDate(project.targetEndDate),
      availabilityExpectation: project.availabilityExpectation ?? "",
      availabilityResponseExpectation:
        project.availabilityResponseExpectation ?? "",
      owner: {
        id: project.owner?.id,
        name: project.owner?.name ?? "",
      },
      ownerName: project.owner?.name ?? "",
      skills: mapSkills(project.skills),
      milestones: (Array.isArray(project.milestones) ? project.milestones : [])
        .map((milestone) => ({
          id: milestone.id,
          name: milestone.title ?? "",
          date: formatDate(milestone.dueDate),
          status: milestone.status ?? "",
        })),
    },
    role: {
      id: role.id,
      title: role.title ?? "",
      description: role.description ?? "",
      responsibilities: role.description ?? "",
      hoursPerWeek: role.hoursPerWeek ?? null,
      hours: role.hoursPerWeek ?? null,
      requiredMembers: role.requiredMembers ?? null,
      status: role.status ?? "",
      statusLabel: readableLabel(role.status),
      skills: mapSkills(role.skills, "minLevel"),
      requiredSkills: mapSkills(role.skills, "minLevel"),
      weeks: durationWeeks,
    },
  };
}

export function sendJoinRequest({
  projectId,
  roleId,
  message,
  proposedHoursPerWeek,
  plannedTaskDeadlines,
}) {
  const body = { roleId: String(roleId) };
  const trimmedMessage =
    message == null
      ? ""
      : typeof message === "string"
        ? message.trim()
        : null;
  const trimmedTaskDeadlines =
    plannedTaskDeadlines == null
      ? ""
      : typeof plannedTaskDeadlines === "string"
        ? plannedTaskDeadlines.trim()
        : null;

  if (trimmedMessage === null) {
    throw new Error("Message must be a string.");
  }
  if (trimmedMessage.length > 1000) {
    throw new Error("Message must be 1000 characters or fewer.");
  }
  if (trimmedTaskDeadlines === null) {
    throw new Error("Planned task deadlines must be a string.");
  }
  if (trimmedTaskDeadlines.length > 2000) {
    throw new Error("Planned task deadlines must be 2000 characters or fewer.");
  }
  if (
    proposedHoursPerWeek != null &&
    (!Number.isInteger(proposedHoursPerWeek) ||
      proposedHoursPerWeek < 1 ||
      proposedHoursPerWeek > 168)
  ) {
    throw new Error("Proposed hours per week must be an integer from 1 to 168.");
  }

  if (trimmedMessage) body.message = trimmedMessage;
  if (proposedHoursPerWeek != null) {
    body.proposedHoursPerWeek = proposedHoursPerWeek;
  }
  if (trimmedTaskDeadlines) body.plannedTaskDeadlines = trimmedTaskDeadlines;

  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/join-requests`,
    body,
  );
}

export function getMyJoinRequests({
  status,
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(Math.min(limit, 50)),
  });
  if (status) params.set("status", status);

  return api.get(`/api/join-requests?${params.toString()}`);
}

export async function getJoinRequests(
  projectId,
  { status, page = 1, limit = 20 } = {},
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(Math.min(limit, 50)),
  });
  if (status) params.set("status", status);

  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/join-requests?${params.toString()}`,
  );
  const requests = Array.isArray(response?.requests) ? response.requests : [];

  return {
    requests: requests.map(mapListRequest),
    pagination: response?.pagination ?? {
      total: requests.length,
      page,
      limit: Math.min(limit, 50),
      totalPages: page,
    },
  };
}

export async function getJoinRequest(projectId, requestId) {
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/join-requests/${encodeURIComponent(requestId)}`,
  );
  if (!response?.request) {
    throw new Error("Join request response is missing request data.");
  }
  return mapJoinRequest(response.request);
}

function decisionBody(decisionNote) {
  const trimmedNote =
    decisionNote == null
      ? ""
      : typeof decisionNote === "string"
        ? decisionNote.trim()
        : null;
  if (trimmedNote === null) {
    throw new Error("Decision note must be a string.");
  }
  if (trimmedNote.length > 500) {
    throw new Error("Decision note must be 500 characters or fewer.");
  }
  return trimmedNote ? { decisionNote: trimmedNote } : undefined;
}

export const approveJoinRequest = (projectId, requestId, decisionNote) =>
  api.post(
    `/api/projects/${encodeURIComponent(projectId)}/join-requests/${encodeURIComponent(requestId)}/approve`,
    decisionBody(decisionNote),
  );

export const declineJoinRequest = (projectId, requestId, decisionNote) =>
  api.post(
    `/api/projects/${encodeURIComponent(projectId)}/join-requests/${encodeURIComponent(requestId)}/decline`,
    decisionBody(decisionNote),
  );

export const withdrawJoinRequest = (requestId) =>
  api.post(
    `/api/join-requests/${encodeURIComponent(requestId)}/withdraw`,
  );

export const confirmJoinRequest = (requestId) =>
  api.post(
    `/api/join-requests/${encodeURIComponent(requestId)}/confirm`,
  );

export function getJoinRequestStatusLabel(status) {
  return REQUEST_STATUS_LABELS[status] ?? readableLabel(status);
}
