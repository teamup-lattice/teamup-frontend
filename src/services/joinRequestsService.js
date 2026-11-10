import { api } from "./api";

export function sendJoinRequest({
  projectId,
  roleId,
  message,
  proposedHoursPerWeek,
  plannedTaskDeadlines,
}) {
  const body = { roleId: String(roleId) };
  const trimmedMessage = message?.trim();
  const trimmedTaskDeadlines = plannedTaskDeadlines?.trim();

  if (trimmedMessage?.length > 1000) {
    throw new Error("Message must be 1000 characters or fewer.");
  }
  if (trimmedTaskDeadlines?.length > 2000) {
    throw new Error("Planned task deadlines must be 2000 characters or fewer.");
  }

  if (trimmedMessage) body.message = trimmedMessage;
  if (
    Number.isInteger(proposedHoursPerWeek) &&
    proposedHoursPerWeek >= 1 &&
    proposedHoursPerWeek <= 168
  ) {
    body.proposedHoursPerWeek = proposedHoursPerWeek;
  }
  if (trimmedTaskDeadlines) body.plannedTaskDeadlines = trimmedTaskDeadlines;

  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/join-requests`,
    body,
  );
}
