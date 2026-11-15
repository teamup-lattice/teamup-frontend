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

export const getVisibility = async () => {
  const data = await api.get("/api/profile/users/me/visibility");
  return data?.visibility;
};

export const saveVisibility = (values, savedValues) => {
  const changes = {};
  for (const [key, apiKey] of Object.entries(visibilityFields)) {
    const val = Boolean(values[key]);
    if (savedValues) {
      const prev = Boolean(savedValues[key]);
      if (val !== prev) {
        changes[apiKey] = val;
      }
    } else {
      changes[apiKey] = val;
    }
  }
  if (savedValues && Object.keys(changes).length === 0) {
    return Promise.resolve({ visibility: values });
  }
  return api.patch("/api/profile/users/me/visibility", changes);
};
