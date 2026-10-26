import { api } from "./api";

export const getSkills = () => api.get("/api/profile/skills");

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
