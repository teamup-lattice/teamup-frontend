import { api } from "./api";

const notificationTypeLabels = {
  PROJECT_INVITATION: "Invitation",
  INVITATION_RESPONDED: "Invitation update",
  JOIN_REQUEST: "Join request",
  JOIN_REQUEST_DECIDED: "Join request update",
  MEMBER_JOINED: "Member joined",
  MEMBER_LEFT: "Member update",
  TASK_ASSIGNED: "Task assigned",
  TASK_COMMENTED: "Task comment",
  TASK_DEADLINE: "Deadline reminder",
  TASK_OVERDUE: "Overdue prompt",
  MILESTONE_UPDATE: "Milestone update",
  TEAM_UPDATE: "Team update",
  CONTRIBUTION_REVIEW: "Contribution review",
  PROJECT_COMPLETED: "Project completed",
};

let lastSaved = [];

function formatNotificationTime(createdAt) {
  const date = new Date(createdAt);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
    return `Today · ${time}`;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getNotificationAction(notification) {
  const projectId = notification.project?.id;
  const entityId = notification.entityId;

  switch (notification.type) {
    case "PROJECT_INVITATION":
    case "INVITATION_RESPONDED":
      if (notification.entityType === "invitation" && entityId) {
        return {
          actionLabel:
            notification.type === "PROJECT_INVITATION"
              ? "Review invitation"
              : "View invitation",
          to: `/invitations/${encodeURIComponent(entityId)}`,
        };
      }
      break;
    case "JOIN_REQUEST":
      if (notification.entityType === "joinRequest" && projectId && entityId) {
        return {
          actionLabel: "Review request",
          to: `/role-requests/${encodeURIComponent(entityId)}?project=${encodeURIComponent(projectId)}`,
        };
      }
      break;
    case "MEMBER_JOINED":
    case "MEMBER_LEFT":
      if (notification.entityType === "membership" && projectId) {
        return {
          actionLabel: "View team",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/team`,
        };
      }
      break;
    case "TASK_ASSIGNED":
    case "TASK_COMMENTED":
    case "TASK_DEADLINE":
    case "TASK_OVERDUE":
      if (notification.entityType === "task" && projectId && entityId) {
        return {
          actionLabel: "Open task",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/tasks/${encodeURIComponent(entityId)}`,
        };
      }
      break;
    case "TEAM_UPDATE":
      if (notification.entityType === "teamUpdate" && projectId) {
        return {
          actionLabel: "Open Updates",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/updates`,
        };
      }
      break;
    case "CONTRIBUTION_REVIEW":
      if (notification.entityType === "contribution" && projectId) {
        return {
          actionLabel: "View contribution",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/contributions`,
        };
      }
      break;
    default:
      break;
  }

  return { actionLabel: "View", to: "/projects" };
}

function mapNotification(notification) {
  const { actionLabel, to } = getNotificationAction(notification);

  return {
    id: notification.id,
    type: notificationTypeLabels[notification.type] ?? "Notification",
    message: notification.message,
    project: notification.project?.title,
    time: formatNotificationTime(notification.createdAt),
    read: notification.readAt !== null,
    actionLabel,
    to,
  };
}

export async function getNotifications() {
  const result = await api.get("/api/notifications?unreadOnly=false&limit=50");
  if (!Array.isArray(result.notifications)) {
    throw new Error(
      "Notifications response did not include a notifications array.",
    );
  }
  lastSaved = result.notifications.map(mapNotification);
  return lastSaved;
}

export function getLastSavedNotifications() {
  return lastSaved;
}

export async function getUnreadCount() {
  const result = await api.get("/api/notifications?limit=1");
  if (typeof result.unreadCount !== "number") {
    throw new Error("Notifications response did not include an unread count.");
  }
  return result.unreadCount;
}

export async function markAllNotificationsRead() {
  const result = await api.patch("/api/notifications/read-all");
  window.dispatchEvent(new Event("notifications:changed"));
  return result;
}

export function markNotificationRead(id) {
  return api.patch(`/api/notifications/${encodeURIComponent(id)}/read`);
}
