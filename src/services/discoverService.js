import { api } from "./api";

const PROJECT_TYPE_VALUES = {
  "web application": "WEB_APPLICATION",
  "mobile app": "MOBILE_APP",
  "desktop app": "DESKTOP_APP",
  "api service": "API_SERVICE",
  "data science": "DATA_SCIENCE",
  design: "DESIGN",
  other: "OTHER",
};

let skillsCache = null;

function getSkillsCatalog() {
  if (!skillsCache) {
    skillsCache = api
      .get("/api/profile/skills")
      .then((response) => {
        if (Array.isArray(response)) return response;
        if (response && typeof response === "object") {
          const array = Object.values(response).find(Array.isArray);
          if (array) return array;
        }
        return [];
      })
      .catch(() => {
        skillsCache = null;
        return [];
      });
  }

  return skillsCache;
}

function getProjectTypeValue(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  return PROJECT_TYPE_VALUES[value.trim().toLowerCase()] ?? "";
}

function normalizeSkillKey(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatProjectType(value) {
  if (typeof value !== "string" || !value) return "";
  const label = value.replaceAll("_", " ").toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDate(value) {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}

function formatDates(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start}–${end}`;
  return start || end || "";
}

function mapProject(project) {
  const roles = Array.isArray(project?.roles) ? project.roles : [];
  const role =
    roles.find((item) => item?.status === "OPEN") ?? roles[0] ?? null;
  const skills = (Array.isArray(project?.skills) ? project.skills : [])
    .map((entry) => entry?.skill?.name)
    .filter((name) => typeof name === "string" && name.trim());

  return {
    id: project?.id ?? "",
    title: project?.title ?? "",
    description: project?.description ?? "",
    role: role?.title ?? "",
    skills,
    hoursPerWeek: role?.hoursPerWeek ?? null,
    weeks: project?.durationWeeks ?? null,
    type: formatProjectType(project?.projectType),
    dates: formatDates(project?.startDate, project?.targetEndDate),
  };
}

export async function getOpenProjects({
  query = "",
  filters = {},
  page = 1,
} = {}) {
  const params = new URLSearchParams();
  const addParam = (name, value) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(name, String(value));
    }
  };

  if (typeof query === "string" && query.trim()) {
    params.set("q", query);
  }

  const selectedSkills = Array.isArray(filters.skill)
    ? filters.skill
    : filters.skill
      ? [filters.skill]
      : [];
  const selectedValues = selectedSkills.filter(
    (value) => value !== "" && value !== null && value !== undefined,
  );
  if (selectedValues.length > 0) {
    const catalog = await getSkillsCatalog();
    const skillIdByKey = new Map();

    for (const skill of catalog) {
      if (
        !skill ||
        skill.id === "" ||
        skill.id === null ||
        skill.id === undefined
      ) {
        continue;
      }

      for (const key of [skill.id, skill.slug, skill.name]) {
        const normalized = normalizeSkillKey(key);
        if (normalized) skillIdByKey.set(normalized, skill.id);
      }
    }

    for (const value of selectedValues) {
      const skillId = skillIdByKey.get(normalizeSkillKey(value));
      if (skillId !== undefined) {
        params.append("skillIds", String(skillId));
      }
    }
  }

  const pageNumber = Number(page);
  if (Number.isInteger(pageNumber) && pageNumber > 1) {
    params.set("page", String(pageNumber));
  }

  addParam("projectType", getProjectTypeValue(filters.type));
  addParam("minDuration", filters.duration);
  addParam("maxDuration", filters.duration);
  addParam("minHours", filters.hours);
  addParam("maxHours", filters.hours);
  addParam("limit", filters.limit);

  const queryString = params.toString();
  const path = queryString ? `/api/projects?${queryString}` : "/api/projects";
  const response = await api.get(path);

  const projects = Array.isArray(response?.projects)
    ? response.projects.map(mapProject)
    : [];

  return {
    projects,
    pagination: response?.pagination ?? null,
  };
}