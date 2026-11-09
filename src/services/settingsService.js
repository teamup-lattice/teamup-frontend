import { api } from "./api";

export async function getSettings() {
  const { user } = await api.get("/api/profile/users/me");

  const profileFields = {
    weeklyAvailabilityHours: user.weeklyAvailabilityHours,
    goals: user.goals,
    preferredProjectDurationWeeks: user.preferredProjectDurationWeeks,
    skills: user.skills.map(({ level, skill }) => ({
      skillId: skill.id,
      level,
    })),
  };
  const optionalFields = [
    "headline",
    "bio",
    "location",
    "timezone",
    "githubUrl",
    "portfolioUrl",
    "isAvailable",
  ];

  for (const field of optionalFields) {
    if (user[field] !== null && user[field] !== undefined) {
      profileFields[field] = user[field];
    }
  }

  return { name: user.name, profileFields };
}

export const saveSettings = (settings) => api.put("/api/profile/users/me/onboarding", settings);
export const requestAccountDeletion = () => api.delete("/api/profile/users/me");