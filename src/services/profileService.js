import { api } from "./api";
import { getMyProfile as fetchMyProfile } from "./dashboardService";

export const getSkills = () => api.get("/api/profile/skills");

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

  return {
    name: user.name ?? "",
    role: user.headline ?? "",
    avatarUrl: user.avatarUrl ?? "",
    skills: skillNames,
    skillLevel: mapSkillLevel(skills),
    goals: user.goals ?? "",
    availabilityHours: user.weeklyAvailabilityHours ?? null,
    durationWeeks: user.preferredProjectDurationWeeks ?? null,
    email: user.email ?? "",
    completedProjects: [],
    visibilitySettings: mapVisibilitySettings(user.visibilitySettings),
  };
}

export function saveProfile(values) {
  // Role is omitted because the backend does not have a field for it yet.
  return api.put("/api/profile/users/me/onboarding", {
    weeklyAvailabilityHours: Number(values.weeklyAvailability),
    goals: values.goals.trim(),
    preferredProjectDurationWeeks: parseInt(values.duration, 10),
    skills: values.skills.map((skillId) => ({
      skillId,
      level: values.skillLevel.toUpperCase(),
    })),
  });
}
