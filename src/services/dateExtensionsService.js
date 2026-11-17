import { api } from "./api";

export async function getDateExtensionRequests(
  projectId,
  { status, taskId } = {},
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (taskId) params.set("taskId", String(taskId));

  const query = params.toString();
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/date-extension-requests${
      query ? `?${query}` : ""
    }`,
  );

  return Array.isArray(response?.requests) ? response.requests : [];
}

export function decideDateExtensionRequest(
  projectId,
  requestId,
  { status, decisionNote } = {},
) {
  if (status !== "ACCEPTED" && status !== "DECLINED") {
    throw new Error("Decision status must be ACCEPTED or DECLINED.");
  }

  const trimmedNote =
    typeof decisionNote === "string" ? decisionNote.trim() : "";

  if (trimmedNote.length > 500) {
    throw new Error("Decision note must be 500 characters or fewer.");
  }

  const body = { status };
  if (trimmedNote) body.decisionNote = trimmedNote;

  return api.patch(
    `/api/projects/${encodeURIComponent(projectId)}/date-extension-requests/${encodeURIComponent(requestId)}`,
    body,
  );
}

export function createDateExtensionRequest(
  projectId,
  { taskId, requestedDate, reason },
) {
  return api.post(
    `/api/projects/${encodeURIComponent(projectId)}/date-extension-requests`,
    {
      taskId,
      requestedDate,
      reason: typeof reason === "string" ? reason.trim() : reason,
    },
  );
}
