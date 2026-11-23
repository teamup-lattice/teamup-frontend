import { api } from "./api";

const today = () => new Date().toISOString().slice(0, 10);

function toDateOnly(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? ""
    : new Date(timestamp).toISOString().slice(0, 10);
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// First draft of the wording, built from the member's Done task titles.
function draftSummary(tasks) {
  if (tasks.length === 0) return "";
  const titles = tasks.map((task) => task.title).filter(Boolean);
  const noun = tasks.length === 1 ? "task" : "tasks";
  return truncate(`Completed ${tasks.length} ${noun}: ${titles.join(", ")}`, 140);
}

function mapReview(review) {
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    return null;
  }

  const reviewer =
    review.reviewer && typeof review.reviewer === "object"
      ? review.reviewer
      : null;

  return {
    id:
      typeof review.id === "string" || typeof review.id === "number"
        ? String(review.id)
        : "",
    decision: typeof review.decision === "string" ? review.decision : "",
    note: typeof review.note === "string" ? review.note : "",
    createdAt: typeof review.createdAt === "string" ? review.createdAt : "",
    reviewer: {
      id:
        typeof reviewer?.id === "string" || typeof reviewer?.id === "number"
          ? String(reviewer.id)
          : "",
      name: typeof reviewer?.name === "string" ? reviewer.name : "",
      avatarUrl: reviewer?.avatarUrl ?? null,
    },
  };
}

function mapContribution(contribution) {
  if (
    !contribution ||
    typeof contribution !== "object" ||
    Array.isArray(contribution)
  ) {
    throw new Error("Contributions response contains invalid contribution data.");
  }

  const member =
    contribution.member && typeof contribution.member === "object"
      ? contribution.member
      : null;
  const user =
    member?.user && typeof member.user === "object" ? member.user : null;

  return {
    id:
      typeof contribution.id === "string" ||
      typeof contribution.id === "number"
        ? String(contribution.id)
        : "",
    title:
      typeof contribution.title === "string" ? contribution.title : "",
    description:
      typeof contribution.description === "string"
        ? contribution.description
        : "",
    status:
      typeof contribution.status === "string" ? contribution.status : "",
    submittedAt:
      typeof contribution.submittedAt === "string"
        ? contribution.submittedAt
        : "",
    confirmedAt:
      typeof contribution.confirmedAt === "string"
        ? contribution.confirmedAt
        : "",
    memberAcknowledgedAt:
      typeof contribution.memberAcknowledgedAt === "string"
        ? contribution.memberAcknowledgedAt
        : "",
    createdAt:
      typeof contribution.createdAt === "string"
        ? contribution.createdAt
        : "",
    updatedAt:
      typeof contribution.updatedAt === "string"
        ? contribution.updatedAt
        : "",
    member: {
      id:
        typeof member?.id === "string" || typeof member?.id === "number"
          ? String(member.id)
          : "",
      accessRole:
        typeof member?.accessRole === "string" ? member.accessRole : "",
      userId:
        typeof user?.id === "string" || typeof user?.id === "number"
          ? String(user.id)
          : "",
      name: typeof user?.name === "string" ? user.name : "",
      avatarUrl: user?.avatarUrl ?? null,
      role: typeof member?.role === "string" ? member.role : "",
    },
    task: contribution.task ?? null,
    evidence: Array.isArray(contribution.evidence)
      ? contribution.evidence
      : [],
    reviews: Array.isArray(contribution.reviews)
      ? contribution.reviews.map(mapReview).filter(Boolean)
      : [],
  };
}

function mapSummaryContribution(contribution) {
  if (
    !contribution ||
    typeof contribution !== "object" ||
    Array.isArray(contribution)
  ) {
    return null;
  }

  const member =
    contribution.member && typeof contribution.member === "object"
      ? contribution.member
      : null;
  const user =
    member?.user && typeof member.user === "object" ? member.user : null;

  return {
    id:
      typeof contribution.id === "string" ||
      typeof contribution.id === "number"
        ? String(contribution.id)
        : "",
    title:
      typeof contribution.title === "string" ? contribution.title : "",
    description:
      typeof contribution.description === "string"
        ? contribution.description
        : "",
    confirmedAt:
      typeof contribution.confirmedAt === "string"
        ? contribution.confirmedAt
        : "",
    member: {
      id:
        typeof member?.id === "string" || typeof member?.id === "number"
          ? String(member.id)
          : "",
      userId:
        typeof user?.id === "string" || typeof user?.id === "number"
          ? String(user.id)
          : "",
      name: typeof user?.name === "string" ? user.name : "",
      avatarUrl: user?.avatarUrl ?? null,
      role: typeof member?.role === "string" ? member.role : "",
    },
    task: contribution.task ?? null,
    evidence: Array.isArray(contribution.evidence)
      ? contribution.evidence
      : [],
  };
}

function contributionPath(projectId, page) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  return `/api/projects/${encodeURIComponent(projectId)}/contributions?${params.toString()}`;
}

export async function getProjectContributions(projectId) {
  const first = await api.get(contributionPath(projectId, 1));
  if (!Array.isArray(first?.contributions)) {
    throw new Error("Contributions response is missing contributions.");
  }

  const contributions = first.contributions.map(mapContribution);
  const totalPages =
    Number.isInteger(first?.pagination?.totalPages) &&
    first.pagination.totalPages > 0
      ? first.pagination.totalPages
      : 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await api.get(contributionPath(projectId, page));
    if (Array.isArray(next?.contributions)) {
      contributions.push(...next.contributions.map(mapContribution));
    }
  }

  return contributions;
}

export async function getContributionSummary(projectId) {
  const data = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/contributions/summary`,
  );
  if (!Array.isArray(data?.contributions)) {
    throw new Error("Contribution summary response is missing contributions.");
  }
  return data.contributions.map(mapSummaryContribution).filter(Boolean);
}

function submittedTime(contribution) {
  const value = contribution.submittedAt || contribution.createdAt;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function findLatestContribution(contributions, userId) {
  return (
    contributions
      .filter(
        (item) =>
          item.task === null && String(item.member.userId) === String(userId),
      )
      .sort((a, b) => submittedTime(b) - submittedTime(a))[0] ?? null
  );
}

function latestReview(contribution, decision) {
  const reviews = Array.isArray(contribution?.reviews)
    ? contribution.reviews
    : [];
  return (
    reviews
      .filter((review) => review.decision === decision)
      .sort((a, b) => {
        const aTime = Date.parse(a.createdAt);
        const bTime = Date.parse(b.createdAt);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      })[0] ?? null
  );
}

// GAP: the backend has no reviewer assignment. This round-robin picker is a
// temporary stand-in until contributions carry a reviewer field.
export function pickReviewer(members, memberId) {
  if (members.length < 2) return null;
  const index = members.findIndex((item) => item.id === memberId);
  return members[(index + 1) % members.length];
}

export async function getContribution(projectId, input, { variant = null } = {}) {
  if (variant === "loadfail") throw new Error("Request failed");

  const { member, members, ownerName } = input;
  const tasks = variant === "empty" ? [] : input.tasks;
  const contributions = await getProjectContributions(projectId);
  const current = findLatestContribution(contributions, member.userId);
  const reviewer = pickReviewer(members, member.id);

  const isConfirmed = current?.status === "CONFIRMED";
  const confirmedReview = isConfirmed ? latestReview(current, "CONFIRMED") : null;
  const confirmedUserIds = new Set(
    contributions
      .filter((item) => item.status === "CONFIRMED")
      .map((item) => String(item.member.userId)),
  );
  const confirmedOthers = members.filter(
    (item) =>
      String(item.id) !== String(member.id) &&
      confirmedUserIds.has(String(item.userId)),
  ).length;

  return {
    contributionId: current?.id ?? null,
    memberId: member.id,
    member: member.name,
    role: member.role,
    summary: current?.title ?? draftSummary(tasks),
    note: current?.description ?? "",
    tasks,
    acknowledged:
      Boolean(current?.memberAcknowledgedAt) ||
      current?.status === "ACKNOWLEDGED",
    reviewedOn: toDateOnly(current?.memberAcknowledgedAt),
    confirmedBy: isConfirmed
      ? confirmedReview?.reviewer?.name || "A teammate"
      : "",
    confirmedById: isConfirmed ? confirmedReview?.reviewer?.id ?? null : null,
    confirmedOn: isConfirmed ? toDateOnly(current?.confirmedAt) : null,
    reviewer: reviewer?.name ?? "a teammate",
    reviewerId: reviewer?.id ?? null,
    team: { confirmedOthers, total: members.length, ownerName },
  };
}

const pendingAcknowledges = new Map();

const contributionKey = (projectId, memberId) => `${projectId}:${memberId}`;

// Saves the member's own wording and marks it Reviewed. A successful save is
// read-only on the screen; there is no second save.
export async function saveOwnReview(
  projectId,
  memberId,
  review,
  { simulateFail = false, existingId = null } = {},
) {
  if (simulateFail) throw new Error("Request failed");

  const key = contributionKey(projectId, memberId);
  let contributionId =
    existingId ?? pendingAcknowledges.get(key) ?? null;

  if (!contributionId) {
    const body = { title: review.summary };
    if (review.note) body.description = review.note;
    const created = await api.post(
      `/api/projects/${encodeURIComponent(projectId)}/contributions`,
      body,
    );
    const contribution = created?.contribution ?? created;
    contributionId = contribution?.id ?? null;
    if (!contributionId) {
      throw new Error("Contribution response is missing an id.");
    }
    pendingAcknowledges.set(key, contributionId);
  }

  const acknowledged = await api.post(
    `/api/projects/${encodeURIComponent(projectId)}/contributions/${encodeURIComponent(contributionId)}/acknowledge`,
  );
  pendingAcknowledges.delete(key);
  const contribution = acknowledged?.contribution ?? acknowledged;
  const memberAcknowledgedAt =
    typeof contribution?.memberAcknowledgedAt === "string"
      ? contribution.memberAcknowledgedAt
      : "";

  return {
    contributionId,
    summary: review.summary,
    note: review.note,
    acknowledged: true,
    reviewedOn: toDateOnly(memberAcknowledgedAt) || today(),
    memberAcknowledgedAt,
  };
}

// A teammate confirms the member's contribution wording (not impact).
export async function confirmContribution(
  projectId,
  contributionId,
  { simulateFail = false } = {},
) {
  if (simulateFail) throw new Error("Request failed");
  if (!contributionId) throw new Error("Contribution is missing an id.");

  const response = await api.post(
    `/api/projects/${encodeURIComponent(projectId)}/contributions/${encodeURIComponent(contributionId)}/review`,
    { decision: "CONFIRMED" },
  );
  const contribution = mapContribution(response?.contribution ?? response);
  const review = latestReview(contribution, "CONFIRMED");

  return {
    status: contribution.status,
    confirmedAt: contribution.confirmedAt,
    confirmedBy: review?.reviewer?.name || "A teammate",
    confirmedById: review?.reviewer?.id ?? null,
    confirmedOn: toDateOnly(contribution.confirmedAt),
    reviews: contribution.reviews,
  };
}
