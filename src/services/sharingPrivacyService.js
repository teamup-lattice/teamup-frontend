import { api } from "./api";
import { getMyProfile } from "./dashboardService";
import { getWorkspaceMembers } from "./workspaceMembersService";

function formatDate(value) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function readableStatus(value) {
  if (typeof value !== "string") return "";
  const words = value.toLowerCase().split(/[_\s]+/).filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

function buildDates(project) {
  const start = formatDate(project.startDate);
  const end = formatDate(project.targetEndDate);
  const range = start && end ? `${start}–${end}` : start || end || "";
  const weeks = Number.isFinite(project.durationWeeks)
    ? `${project.durationWeeks} ${
        project.durationWeeks === 1 ? "week" : "weeks"
      }`
    : "";
  return [range, weeks].filter(Boolean).join(" · ");
}

function mapTeam(members) {
  return members.map((member) => ({
    name: member.name ?? "",
    role: member.role ?? "",
  }));
}

export async function getSharingPrivacy(projectId) {
  const [projectResponse, profileResponse, members] = await Promise.all([
    api.get(`/api/projects/${encodeURIComponent(projectId)}`),
    getMyProfile(),
    getWorkspaceMembers(projectId),
  ]);

  const project = projectResponse?.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    throw new Error("Project response is missing project data.");
  }

  const user = profileResponse?.user;
  if (!user || (typeof user.id !== "string" && typeof user.id !== "number")) {
    throw new Error("Profile response is missing the current user.");
  }

  const isShared = Boolean(project.isShared);
  const isOwner =
    project.ownerId != null && String(project.ownerId) === String(user.id);

  return {
    user: {
      id: user.id,
      name: typeof user.name === "string" ? user.name : "",
    },
    isShared,
    isOwner,
    project: {
      id: project.id ?? projectId,
      title: typeof project.title === "string" ? project.title : "",
      status: readableStatus(project.status),
      completedOn: formatDate(project.completedAt),
      dates: buildDates(project),
      summary:
        project.completionOutcome ?? project.outcome ?? "",
      ownerId: project.ownerId ?? null,
    },
    team: mapTeam(members),
    sharing: {
      savedVisibility: isShared ? "Shared" : "Team-only",
    },
    profile: {
      displayOnProfile: false,
    },
  };
}

export function shareProject(projectId) {
  return api.post(`/api/projects/${encodeURIComponent(projectId)}/share`);
}

export function unshareProject(projectId) {
  return api.post(`/api/projects/${encodeURIComponent(projectId)}/unshare`);
}

// Profile display has no backend field yet. This stays non-persistent so the
// private project page keeps its existing control until a real field exists.
export const saveProfileDisplay = (displayOnProfile) =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ displayOnProfile }), 800);
  });
