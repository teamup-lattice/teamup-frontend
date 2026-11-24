import { api } from "./api";
import {
  normalizeProjectTypeValue,
  projectTypeOptions,
} from "../data/discoverData";

const PROJECT_TYPE_LABELS = new Map(
  projectTypeOptions.map((option) => [option.value, option.label]),
);

function formatProjectType(value) {
  if (typeof value !== "string" || !value) return "";
  const enumValue = value.toUpperCase();
  const label = PROJECT_TYPE_LABELS.get(enumValue);
  if (label) return label;
  const fallback = value.replaceAll("_", " ").toLowerCase();
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

export function formatDate(value) {
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

function selectDisplayRole(roles, roleFilter) {
  const filter =
    typeof roleFilter === "string" ? roleFilter.trim().toLowerCase() : "";

  if (filter) {
    const matches = (role) =>
      typeof role?.title === "string" &&
      role.title.toLowerCase().includes(filter);

    return (
      roles.find((role) => role?.status === "OPEN" && matches(role)) ??
      roles.find(matches) ??
      roles.find((role) => role?.status === "OPEN") ??
      roles[0] ??
      null
    );
  }

  return roles.find((role) => role?.status === "OPEN") ?? roles[0] ?? null;
}

function mapProject(project, roleFilter = "") {
  const roles = Array.isArray(project?.roles) ? project.roles : [];
  const role = selectDisplayRole(roles, roleFilter);
  const skills = (Array.isArray(project?.skills) ? project.skills : [])
    .map((entry) => entry?.skill?.name)
    .filter((name) => typeof name === "string" && name.trim());

  return {
    id: project?.id ?? "",
    title: project?.title ?? "",
    description: project?.description ?? "",
    role: role?.title ?? "",
    roleStatus: role?.status ?? "",
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

  for (const value of selectedSkills) {
    if (value !== "" && value !== null && value !== undefined) {
      params.append("skillIds", String(value));
    }
  }

  const pageNumber = Number(page);
  if (Number.isInteger(pageNumber) && pageNumber > 1) {
    params.set("page", String(pageNumber));
  }

  addParam("roleTitle", filters.role);
  addParam("projectType", normalizeProjectTypeValue(filters.type));
  addParam("minDuration", filters.duration);
  addParam("maxDuration", filters.duration);
  addParam("minHours", filters.hours);
  addParam("maxHours", filters.hours);
  addParam("limit", filters.limit);

  const queryString = params.toString();
  const path = queryString ? `/api/projects?${queryString}` : "/api/projects";
  const response = await api.get(path);

  const projects = Array.isArray(response?.projects)
    ? response.projects.map((project) => mapProject(project, filters.role))
    : [];

  return {
    projects,
    pagination: response?.pagination ?? null,
  };
}