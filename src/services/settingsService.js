import { api } from "./api";

export const NOTIFICATION_TYPE_MAP = {
  invitations: "PROJECT_INVITATION",
  joinRequests: "JOIN_REQUEST",
  deadlineReminders: "TASK_DEADLINE",
  overduePrompts: "TASK_OVERDUE",
};

const defaultVisibility = {
  showName: true,
  showHeadline: true,
  showSkills: true,
  showSkillLevels: true,
  showGoals: true,
  showAvailability: true,
  showPreferredDuration: true,
};

export async function getSettings() {
  const [{ user }, visibilityRes, notifRes] = await Promise.all([
    api.get("/api/profile/users/me"),
    api.get("/api/profile/users/me/visibility"),
    api.get("/api/notifications/preferences"),
  ]);

  const profileFields = {
    weeklyAvailabilityHours: user.weeklyAvailabilityHours,
    goals: user.goals,
    preferredProjectDurationWeeks: user.preferredProjectDurationWeeks,
    skills: (user.skills || []).map(({ level, skill }) => ({
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

  const preferencesList = Array.isArray(notifRes?.preferences)
    ? notifRes.preferences
    : [];
  const inAppPrefs = new Map(
    preferencesList
      .filter((p) => p.channel === "IN_APP")
      .map((p) => [p.type, p.enabled]),
  );

  const notifications = {
    invitations: inAppPrefs.has("PROJECT_INVITATION")
      ? Boolean(inAppPrefs.get("PROJECT_INVITATION"))
      : true,
    joinRequests: inAppPrefs.has("JOIN_REQUEST")
      ? Boolean(inAppPrefs.get("JOIN_REQUEST"))
      : true,
    deadlineReminders: inAppPrefs.has("TASK_DEADLINE")
      ? Boolean(inAppPrefs.get("TASK_DEADLINE"))
      : true,
    overduePrompts: inAppPrefs.has("TASK_OVERDUE")
      ? Boolean(inAppPrefs.get("TASK_OVERDUE"))
      : true,
    roleReleasedMessages: true,
    weeklyCheckIns: true,
    ownerInactivityPrompts: true,
  };

  const visibility = {
    ...defaultVisibility,
    ...(visibilityRes?.visibility ?? {}),
  };

  return {
    name: user.name,
    avatarUrl: user.avatarUrl ?? "",
    profileFields,
    notifications,
    visibility,
    hasSavedPreferences: true,
  };
}

export async function updateNotificationPreferences(changedPreferences) {
  if (!changedPreferences || changedPreferences.length === 0) return null;
  return api.put("/api/notifications/preferences", {
    preferences: changedPreferences,
  });
}

export async function updateVisibility(changedVisibility) {
  if (!changedVisibility || Object.keys(changedVisibility).length === 0) return null;
  return api.patch("/api/profile/users/me/visibility", changedVisibility);
}

export async function saveSettings(
  { name, goals, notifications, visibility } = {},
  saved = {},
) {
  const promises = [];

  const profileChanges = {};
  if (name !== undefined && name !== saved.name) profileChanges.name = name;
  if (goals !== undefined && goals !== saved.goals) profileChanges.goals = goals;

  if (Object.keys(profileChanges).length > 0) {
    promises.push(api.patch("/api/profile/users/me", profileChanges));
  }

  if (notifications && saved.notifications) {
    const changedPrefs = [];
    for (const [key, type] of Object.entries(NOTIFICATION_TYPE_MAP)) {
      if (
        notifications[key] !== undefined &&
        notifications[key] !== saved.notifications[key]
      ) {
        changedPrefs.push({
          type,
          channel: "IN_APP",
          enabled: Boolean(notifications[key]),
        });
      }
    }
    if (changedPrefs.length > 0) {
      promises.push(updateNotificationPreferences(changedPrefs));
    }
  }

  if (visibility && saved.visibility) {
    const visibilityChanges = {};
    for (const key of Object.keys(defaultVisibility)) {
      if (
        visibility[key] !== undefined &&
        visibility[key] !== saved.visibility[key]
      ) {
        visibilityChanges[key] = Boolean(visibility[key]);
      }
    }
    if (Object.keys(visibilityChanges).length > 0) {
      promises.push(updateVisibility(visibilityChanges));
    }
  }

  return Promise.all(promises);
}

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
