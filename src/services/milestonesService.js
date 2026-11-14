import { api } from "./api";

function toDateInput(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? "" : new Date(timestamp).toISOString().slice(0, 10);
}

function mapMilestone(milestone) {
  if (!milestone || typeof milestone !== "object" || Array.isArray(milestone)) {
    throw new Error("Milestone response contains invalid milestone data.");
  }

  return {
    id: typeof milestone.id === "string" || typeof milestone.id === "number"
      ? milestone.id
      : "",
    name: typeof milestone.title === "string" ? milestone.title : "",
    targetDate: toDateInput(milestone.dueDate),
  };
}

export async function getProjectMilestones(projectId) {
  const response = await api.get(`/api/projects/${projectId}/milestones`);
  if (!Array.isArray(response?.milestones)) {
    throw new Error("Milestone response is missing milestones.");
  }
  return response.milestones.map(mapMilestone);
}

export const patchProjectMilestone = (projectId, milestoneId, changes) =>
  api.patch(
    `/api/projects/${projectId}/milestones/${milestoneId}`,
    changes,
  );

export const createProjectMilestone = (projectId, milestone) =>
  api.post(`/api/projects/${projectId}/milestones`, milestone);

export const deleteProjectMilestone = (projectId, milestoneId) =>
  api.delete(`/api/projects/${projectId}/milestones/${milestoneId}`);
