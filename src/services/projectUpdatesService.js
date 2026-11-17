import { api } from "./api";

function localDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function mapUpdate(update) {
  return {
    id: update?.id,
    author: update?.author?.name ?? "",
    message: update?.content ?? "",
    date: localDate(update?.createdAt),
    time: localTime(update?.createdAt),
  };
}

export async function getProjectUpdates(projectId) {
  const response = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/updates?page=1&limit=20`,
  );
  const updates = Array.isArray(response?.updates) ? response.updates : [];
  return updates.map(mapUpdate);
}

export async function postProjectUpdate(projectId, content) {
  const response = await api.post(
    `/api/projects/${encodeURIComponent(projectId)}/updates`,
    { content },
  );
  return mapUpdate(response?.update);
}
