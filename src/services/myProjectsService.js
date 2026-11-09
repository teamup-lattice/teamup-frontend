import { api } from "./api";

export const getMyProjects = () => api.get("/api/projects/mine");
export const getRecommendedProjects = (limit) => api.get("/api/projects/recommended", { params: { limit } });
export const createDraft = (projectData) => api.post("/api/projects", projectData);
export const getProjectById = (id) => api.get(`/api/projects/${id}`);
export const updateDraft = (id, projectData) => api.put(`/api/projects/${id}`, projectData);
export const publishProject = (id) => api.post(`/api/projects/${id}/publish`);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);

export function inviteCollaborator({
  projectId,
  roleId,
  inviteeId,
  message,
  proposedHoursPerWeek,
}) {
  const body = {
    inviteeId: String(inviteeId),
    roleId: String(roleId),
  };
  const trimmedMessage = message?.trim();
  if (trimmedMessage) body.message = trimmedMessage;
  if (
    Number.isInteger(proposedHoursPerWeek) &&
    proposedHoursPerWeek >= 1 &&
    proposedHoursPerWeek <= 168
  ) {
    body.proposedHoursPerWeek = proposedHoursPerWeek;
  }

  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/invitations`,
    body,
  );
}

function capitalize(value) {
  const label = value.toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function mapCollaborator(user) {
  return {
    id: user.id,
    name: user.name ?? "",
    headline: user.headline ?? "",
    avatarUrl: user.avatarUrl ?? "",
    location: user.location ?? "",
    skills: (Array.isArray(user.skills) ? user.skills : [])
      .filter((entry) => entry?.skill?.name)
      .map((entry) => {
        const level = entry.level ? capitalize(entry.level) : "";
        return level ? `${entry.skill.name} · ${level}` : entry.skill.name;
      }),
    availability:
      user.weeklyAvailabilityHours == null
        ? ""
        : `${user.weeklyAvailabilityHours} ${
            user.weeklyAvailabilityHours === 1 ? "hr" : "hrs"
          }/week`,
    preferredDuration:
      user.preferredProjectDurationWeeks == null
        ? ""
        : `${user.preferredProjectDurationWeeks} ${
            user.preferredProjectDurationWeeks === 1 ? "week" : "weeks"
          }`,
  };
}

export async function getProjectCollaborators(
  projectId,
  roleId,
  { skills = [], projectType, durationWeeks, weeklyHours, page = 1, limit = 20 } = {},
) {
  if (!roleId) {
    throw new Error("A role is required to find collaborators.");
  }

  const params = new URLSearchParams({
    roleId: String(roleId),
    page: String(page),
    limit: String(limit),
  });
  if (skills.length > 0) params.set("skills", skills.join(","));
  if (projectType) params.set("projectType", projectType);
  if (durationWeeks) params.set("durationWeeks", String(durationWeeks));
  if (weeklyHours) params.set("weeklyHours", String(weeklyHours));

  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/collaborators?${params.toString()}`,
  );
  const users = Array.isArray(response?.users) ? response.users : [];

  return {
    ...response,
    count: response?.count ?? response?.pagination?.total ?? users.length,
    users: users.map(mapCollaborator),
  };
}
