import { api } from "./api";

const visibilityFields = {
  name: "showName",
  role: "showHeadline",
  skills: "showSkills",
  skillLevel: "showSkillLevels",
  goals: "showGoals",
  availability: "showAvailability",
  duration: "showPreferredDuration",
};

export const saveVisibility = (values) => {
  const settings = Object.fromEntries(
    Object.entries(visibilityFields).map(([key, apiKey]) => [
      apiKey,
      Boolean(values[key]),
    ]),
  );
  return api.patch("/api/profile/users/me/visibility", settings);
};