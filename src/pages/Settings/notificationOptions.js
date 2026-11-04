export const notificationOptions = [
  { key: "invitations", label: "Invitations" },
  { key: "joinRequests", label: "Join requests" },
  { key: "deadlineReminders", label: "Deadline reminders" },
  { key: "overduePrompts", label: "Overdue prompts" },
  { key: "roleReleasedMessages", label: "Role-released messages" },
  { key: "weeklyCheckIns", label: "Weekly check-ins" },
  {
    key: "ownerInactivityPrompts",
    label: "Owner inactivity prompts",
    helperText: "Only for projects you own.",
  },
];

export function onOff(isOn) {
  return isOn ? "On" : "Off";
}
