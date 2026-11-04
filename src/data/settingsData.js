// Mock data for the Settings screen. Replace with API responses later.
const allOn = {
  invitations: true,
  joinRequests: true,
  deadlineReminders: true,
  overduePrompts: true,
  roleReleasedMessages: true,
  weeklyCheckIns: true,
  ownerInactivityPrompts: true,
};

const settingsData = {
  // Someone with saved preferences.
  saved: {
    name: "Ada",
    goals: "Practice defining requirements and coordinating a small product team.",
    notifications: { ...allOn, roleReleasedMessages: false },
    hasSavedPreferences: true,
  },
  // A new account that has not saved anything yet (default choices).
  defaults: {
    name: "Ada",
    goals: "",
    notifications: allOn,
    hasSavedPreferences: false,
  },
};

export default settingsData;
