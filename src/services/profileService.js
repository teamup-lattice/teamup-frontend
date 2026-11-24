import { api } from "./api";
import { getMyProfile as fetchMyProfile } from "./dashboardService";

export const getSkillCategories = () =>
  api.get("/api/profile/skills/categories");

export const getSkills = (category) => {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return api.get(`/api/profile/skills${query}`);
};

function mapVisibilitySettings(settings = {}) {
  const visibility = settings ?? {};
  return {
    name: Boolean(visibility.showName),
    role: Boolean(visibility.showHeadline),
    skills: Boolean(visibility.showSkills),
    skillLevel: Boolean(visibility.showSkillLevels),
    goals: Boolean(visibility.showGoals),
    availability: Boolean(visibility.showAvailability),
    duration: Boolean(visibility.showPreferredDuration),
    // GAP: completed-project display has no backend field; do not reuse showProfile.
    showProject: false,
  };
}

function mapSkillLevel(skills) {
  if (skills.length === 0) return "";

  const levels = skills.map((entry) => entry?.level);
  if (
    levels.some((level) => typeof level !== "string" || !level) ||
    new Set(levels).size > 1
  ) {
    return "Mixed levels";
  }

  const level = levels[0].toLowerCase();
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function completedProjectsPath(userId, page) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  return `/api/profile/users/${encodeURIComponent(userId)}/completed-projects?${params.toString()}`;
}

// GAP: the completed-projects item shape is not confirmed. Only id and title
// are mapped; completion date, role/dates and contribution wording are left
// empty until the backend documents them.
function mapCompletedProject(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;

  const id =
    typeof item.id === "string" || typeof item.id === "number"
      ? String(item.id)
      : "";
  const title = typeof item.title === "string" ? item.title : "";
  if (!id && !title) return null;

  return {
    id,
    title,
    completedOn: "",
    roleAndDates: "",
    contribution: "",
    pageTo: id ? `/projects/${id}/page` : "",
  };
}

export async function getCompletedProjects(userId) {
  const first = await api.get(completedProjectsPath(userId, 1));
  if (!Array.isArray(first?.projects)) {
    throw new Error("Completed projects response is missing projects.");
  }

  const projects = first.projects.map(mapCompletedProject).filter(Boolean);
  const totalPages =
    Number.isInteger(first?.pagination?.totalPages) &&
    first.pagination.totalPages > 0
      ? first.pagination.totalPages
      : 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await api.get(completedProjectsPath(userId, page));
    if (Array.isArray(next?.projects)) {
      projects.push(...next.projects.map(mapCompletedProject).filter(Boolean));
    }
  }

  return projects;
}

export async function getProfile() {
  const response = await fetchMyProfile();
  const user = response?.user;
  if (!user) {
    throw new Error("Profile response is missing user data.");
  }

  const skills = Array.isArray(user.skills) ? user.skills : [];
  const skillNames = skills
    .map((entry) => entry?.skill?.name?.trim())
    .filter((name) => typeof name === "string" && name.length > 0);
  const skillIds = skills
    .map((entry) => entry?.skill?.id)
    .filter((id) => id !== undefined && id !== null);

  const completedProjects = await getCompletedProjects(user.id).catch(
    (error) => {
      console.error("Failed to load completed projects:", error);
      return [];
    },
  );

  return {
    id: user.id,
    name: user.name ?? "",
    role: user.headline ?? "",
    avatarUrl: user.avatarUrl ?? "",
    skills: skillNames,
    skillIds,
    skillLevel: mapSkillLevel(skills),
    goals: user.goals ?? "",
    availabilityHours: user.weeklyAvailabilityHours ?? null,
    durationWeeks: user.preferredProjectDurationWeeks ?? null,
    email: user.email ?? "",
    completedProjects,
    visibilitySettings: mapVisibilitySettings(user.visibilitySettings),
  };
}

export function saveProfile(values) {
  return api.put("/api/profile/users/me/onboarding", {
    headline: values.role,
    weeklyAvailabilityHours: Number(values.weeklyAvailability),
    goals: values.goals.trim(),
    preferredProjectDurationWeeks: parseInt(values.duration, 10),
    skills: values.skills.map((skillId) => ({
      skillId,
      level: values.skillLevel.toUpperCase(),
    })),
  });
}

export async function updateProfileName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) {
    const error = new Error("Invalid name");
    error.status = 400;
    throw error;
  }
  if (trimmed.length > 100) {
    const error = new Error("Name cannot exceed 100 characters");
    error.status = 400;
    throw error;
  }

  try {
    const response = await api.patch("/api/profile/users/me", { name: trimmed });
    window.dispatchEvent(new Event("profile:changed"));
    return response?.user?.name || response?.name || trimmed;
  } catch (error) {
    if (
      error.status === 400 &&
      (!error.message || error.message === "Something went wrong")
    ) {
      error.message = "Invalid name";
    } else if (
      error.status === 404 &&
      (!error.message || error.message === "Something went wrong")
    ) {
      error.message = "User not found";
    }
    throw error;
  }
}

export async function updateProfileDetails({ name, goals }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (goals !== undefined) body.goals = goals;

  try {
    const response = await api.patch("/api/profile/users/me", body);
    window.dispatchEvent(new Event("profile:changed"));
    return response;
  } catch (error) {
    if (
      error.status === 400 &&
      (!error.message || error.message === "Something went wrong")
    ) {
      error.message = "Invalid profile details";
    }
    throw error;
  }
}