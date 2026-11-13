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

  return {
    name: user.name,
    avatarUrl: user.avatarUrl ?? "",
    profileFields,
  };
}

export const saveSettings = (settings) => api.put("/api/profile/users/me/onboarding", settings);
export const requestAccountDeletion = () => api.delete("/api/profile/users/me");

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const data = await api.post("/api/uploads?context=avatar", formData);
  const fileUrl = data?.fileUrl;

  if (!fileUrl) {
    throw new Error("Upload did not return a valid file URL.");
  }

  await api.patch("/api/profile/users/me", { avatarUrl: fileUrl });
  window.dispatchEvent(new Event("profile:changed"));
  return fileUrl;
}

export async function removeAvatar() {
  await api.patch("/api/profile/users/me", { avatarUrl: null });
  window.dispatchEvent(new Event("profile:changed"));
}