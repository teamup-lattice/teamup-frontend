import { api } from "./api";

export function createHandoverRequest(projectId, taskId, note) {
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  const body = {};
  if (trimmedNote) body.note = trimmedNote;

  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/handover-request`,
    body,
  );
}

export async function getHandoverRequests(
  projectId,
  { status = "PENDING" } = {},
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const query = params.toString();
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/handover-requests${
      query ? `?${query}` : ""
    }`,
  );

  return Array.isArray(response?.requests) ? response.requests : [];
}

export function acceptHandoverRequest(
  projectId,
  requestId,
  { assigneeMemberId, handoverNote } = {},
) {
  const body = {};
  if (assigneeMemberId != null) body.assigneeMemberId = assigneeMemberId;

  const trimmedNote =
    typeof handoverNote === "string" ? handoverNote.trim() : "";
  if (trimmedNote) body.handoverNote = trimmedNote;

  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/handover-requests/${encodeURIComponent(requestId)}/accept`,
    body,
  );
}

export const declineHandoverRequest = (projectId, requestId) =>
  api.post(
    `/api/projects/${encodeURIComponent(projectId)}/handover-requests/${encodeURIComponent(requestId)}/decline`,
  );

export const cancelHandoverRequest = (projectId, requestId) =>
  api.post(
    `/api/projects/${encodeURIComponent(projectId)}/handover-requests/${encodeURIComponent(requestId)}/cancel`,
  );
