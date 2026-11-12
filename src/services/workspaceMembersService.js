import { getMyProfile } from "./dashboardService";
import { getProjectById } from "./projectService";
import { api } from "./api";

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
  const words = value.toLowerCase().split("_");
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

function mapMember(member) {
  if (!member || typeof member !== "object" || Array.isArray(member)) {
    throw new Error("Members response contains invalid member data.");
  }

  const id =
    typeof member.id === "string" || typeof member.id === "number"
      ? member.id
      : "";
  const userId =
    typeof member.userId === "string" || typeof member.userId === "number"
      ? member.userId
      : "";
  if (id === "" || userId === "") {
    throw new Error("Members response is missing member or user identifiers.");
  }
  const openTaskCount = Number.isInteger(member.openTaskCount)
    ? member.openTaskCount
    : null;

  return {
    id,
    userId,
    name: typeof member.user?.name === "string" ? member.user.name : "",
    role: typeof member.role?.title === "string" ? member.role.title : "",
    accessLevel:
      typeof member.accessRole === "string" ? member.accessRole : "",
    acceptedDate: formatDate(member.joinedAt),
    openTaskCount,
    hoursPerWeek:
      typeof member.committedHoursPerWeek === "number"
        ? member.committedHoursPerWeek
        : null,
  };
}

export async function getWorkspaceMembers(projectId) {
  const response = await api.get(`/api/projects/${projectId}/members`);
  if (!Array.isArray(response?.members)) {
    throw new Error("Members response is missing members.");
  }
  return response.members.map(mapMember);
}

export async function getWorkspaceProject(projectId) {
  const response = await getProjectById(projectId);
  const project = response?.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    throw new Error("Project response is missing project data.");
  }

  return {
    id: project.id,
    name: typeof project.title === "string" ? project.title : "",
    status: readableStatus(project.status),
    ownerId: project.ownerId ?? null,
    ownerName: typeof project.owner?.name === "string" ? project.owner.name : "",
    startDate: typeof project.startDate === "string" ? project.startDate : "",
    endDate:
      typeof project.targetEndDate === "string" ? project.targetEndDate : "",
    durationWeeks:
      typeof project.durationWeeks === "number" ? project.durationWeeks : null,
    memberships: (Array.isArray(project.memberships) ? project.memberships : [])
      .filter(
        (membership) =>
          membership &&
          (typeof membership.id === "string" ||
            typeof membership.id === "number"),
      )
      .map((membership) => ({
        id: membership.id,
        userId: membership.userId ?? "",
        name:
          typeof membership.user?.name === "string"
            ? membership.user.name
            : "",
        role:
          typeof membership.role?.title === "string"
            ? membership.role.title
            : "",
        accessLevel:
          typeof membership.accessRole === "string"
            ? membership.accessRole
            : "",
        status:
          typeof membership.status === "string" ? membership.status : "",
      })),
  };
}

export async function getWorkspaceCurrentUser() {
  const response = await getMyProfile();
  const user = response?.user;
  if (!user || (typeof user.id !== "string" && typeof user.id !== "number")) {
    throw new Error("Profile response is missing the current user.");
  }
  return {
    id: user.id,
    name: typeof user.name === "string" ? user.name : "",
  };
}

export async function releaseWorkspaceMember(projectId, memberId, body) {
  const response = await api.post(
    `/api/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}/release`,
    body,
  );
  return {
    message: typeof response?.message === "string" ? response.message : "",
    memberId: response?.memberId ?? "",
    roleReopened: response?.roleReopened === true,
  };
}
