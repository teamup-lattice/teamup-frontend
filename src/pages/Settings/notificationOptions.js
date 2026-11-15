export const notificationGroups = [
  {
    title: "Invitations and requests",
    options: [
      {
        key: "invitations",
        label: "Invitations",
        type: "PROJECT_INVITATION",
        default: true,
      },
      {
        key: "joinRequests",
        label: "Join requests",
        type: "JOIN_REQUEST",
        default: true,
      },
      {
        key: "repliesToMyInvitations",
        label: "Replies to my invitations",
        type: "INVITATION_RESPONDED",
        default: true,
      },
      {
        key: "decisionsOnMyJoinRequests",
        label: "Decisions on my join requests",
        type: "JOIN_REQUEST_DECIDED",
        default: true,
      },
    ],
  },
  {
    title: "Team",
    options: [
      {
        key: "someoneJoinsMyProject",
        label: "Someone joins my project",
        type: "MEMBER_JOINED",
        default: true,
      },
      {
        key: "someoneLeavesMyProject",
        label: "Someone leaves my project",
        type: "MEMBER_LEFT",
        default: true,
      },
      {
        key: "teamUpdates",
        label: "Team updates",
        type: "TEAM_UPDATE",
        default: true,
      },
    ],
  },
  {
    title: "Tasks",
    options: [
      {
        key: "tasksAssignedToMe",
        label: "Tasks assigned to me",
        type: "TASK_ASSIGNED",
        default: true,
      },
      {
        key: "commentsOnMyTasks",
        label: "Comments on my tasks",
        type: "TASK_COMMENTED",
        default: true,
      },
      {
        key: "deadlineReminders",
        label: "Deadline reminders",
        type: "TASK_DEADLINE",
        default: true,
      },
      {
        key: "overduePrompts",
        label: "Overdue prompts",
        type: "TASK_OVERDUE",
        default: true,
      },
    ],
  },
  {
    title: "Project",
    options: [
      {
        key: "milestoneUpdates",
        label: "Milestone updates",
        type: "MILESTONE_UPDATE",
        default: true,
      },
      {
        key: "contributionReviews",
        label: "Contribution reviews",
        type: "CONTRIBUTION_REVIEW",
        default: true,
      },
      {
        key: "projectCompleted",
        label: "Project completed",
        type: "PROJECT_COMPLETED",
        default: true,
      },
    ],
  },
  {
    title: "Other",
    options: [
      {
        key: "roleReleasedMessages",
        label: "Role-released messages",
        default: true,
      },
      {
        key: "weeklyCheckIns",
        label: "Weekly check-ins",
        default: true,
      },
      {
        key: "ownerInactivityPrompts",
        label: "Owner inactivity prompts",
        helperText: "Only for projects you own.",
        default: true,
      },
    ],
  },
];

export const notificationOptions = notificationGroups.flatMap(
  (group) => group.options,
);

export const defaultNotifications = Object.fromEntries(
  notificationOptions.map((option) => [option.key, option.default ?? true]),
);

export const NOTIFICATION_TYPE_MAP = Object.fromEntries(
  notificationOptions
    .filter((option) => Boolean(option.type))
    .map((option) => [option.key, option.type]),
);

export function onOff(isOn) {
  return isOn ? "On" : "Off";
}
