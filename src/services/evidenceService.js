import { api } from "./api";

const EVIDENCE_TYPES = new Set([
  "REPOSITORY",
  "LIVE_DEMO",
  "DOCUMENT",
  "IMAGE",
  "VIDEO",
  "OTHER",
]);

const FILE_TYPES = new Set(["DOCUMENT", "IMAGE", "VIDEO"]);
const LINK_TYPES = new Set(["REPOSITORY", "LIVE_DEMO"]);

function normalizeType(value) {
  if (typeof value !== "string") return "";
  const type = value.trim().toUpperCase();
  return EVIDENCE_TYPES.has(type) ? type : "";
}

function evidenceKind(type, url) {
  if (LINK_TYPES.has(type)) return "link";
  if (FILE_TYPES.has(type)) return "file";
  return /^https?:\/\//i.test(url) ? "link" : "file";
}

function mapEvidence(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;

  const title = typeof item.title === "string" ? item.title.trim() : "";
  const url = typeof item.url === "string" ? item.url.trim() : "";
  if (!title && !url) return null;

  const type = normalizeType(item.type);
  const label = title || url;

  return {
    id:
      typeof item.id === "string" || typeof item.id === "number"
        ? String(item.id)
        : "",
    title: label,
    label,
    name: label,
    url,
    type,
    kind: evidenceKind(type, url),
    description:
      typeof item.description === "string" ? item.description.trim() : "",
  };
}

function evidenceList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.evidence)) return data.evidence;
  if (data?.evidence && typeof data.evidence === "object") {
    return [data.evidence];
  }
  return [];
}

export function normalizeHttpUrl(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return "";

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function typeFromFile(file) {
  const mime = typeof file?.type === "string" ? file.type : "";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

function normalizeChecks(checks) {
  if (!Array.isArray(checks)) return [];
  return checks
    .map((check) =>
      typeof check === "string" ? check : typeof check?.message === "string" ? check.message : "",
    )
    .filter(Boolean);
}

export async function getProjectEvidence(projectId) {
  const data = await api.get(
    `/api/projects/${encodeURIComponent(projectId)}/evidence`,
  );
  return evidenceList(data).map(mapEvidence).filter(Boolean);
}

export async function createProjectEvidence(projectId, evidence) {
  const response = await api.post(
    `/api/projects/${encodeURIComponent(projectId)}/evidence`,
    evidence,
  );
  const list = evidenceList(response);
  return mapEvidence(list[0] ?? response) ?? mapEvidence(evidence);
}

export function deleteProjectEvidence(projectId, evidenceId) {
  return api.delete(
    `/api/projects/${encodeURIComponent(projectId)}/evidence/${encodeURIComponent(evidenceId)}`,
  );
}

export async function uploadEvidenceFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const data = await api.post("/api/uploads", formData);
  const fileUrl = typeof data?.fileUrl === "string" ? data.fileUrl : "";
  if (!fileUrl) {
    throw new Error("Upload did not return a valid file URL.");
  }
  return fileUrl;
}

export async function saveEvidenceDeliverable(projectId, deliverable) {
  if (!deliverable || typeof deliverable !== "object") {
    throw new Error("Add a file or link before saving.");
  }

  let url;
  let type = normalizeType(deliverable.type);

  if (deliverable.kind === "file") {
    if (!deliverable.file) {
      throw new Error("Choose a file before saving.");
    }
    url = await uploadEvidenceFile(deliverable.file);
    type = type || typeFromFile(deliverable.file);
  } else {
    url = normalizeHttpUrl(deliverable.url || deliverable.name);
    if (!url) {
      throw new Error("Enter a valid project deliverable link.");
    }
  }

  const titleSource = deliverable.label || deliverable.title || deliverable.name || url;
  const title = String(titleSource).trim().slice(0, 150) || "Project deliverable";
  const body = { title, url };
  if (type) body.type = type;
  if (typeof deliverable.description === "string" && deliverable.description.trim()) {
    body.description = deliverable.description.trim();
  }

  return createProjectEvidence(projectId, body);
}

export async function completeProject(projectId, outcome) {
  const trimmedOutcome = typeof outcome === "string" ? outcome.trim() : "";

  try {
    return await api.post(
      `/api/projects/${encodeURIComponent(projectId)}/complete`,
      { outcome: trimmedOutcome },
    );
  } catch (error) {
    if (error?.status === 409) {
      const checks = normalizeChecks(
        error.checks ?? error.errors ?? error.data?.checks,
      );
      const wrapped = new Error(
        error.message || "Project cannot be completed yet.",
      );
      wrapped.status = 409;
      wrapped.checks = checks;
      throw wrapped;
    }
    throw error;
  }
}
