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
  TASK_HANDOVER_REQUEST: "Handover request",
  TASK_HANDOVER_DECIDED: "Handover",
  DATE_EXTENSION_REQUEST: "Date request",
  DATE_EXTENSION_DECIDED: "Date request update",
  MILESTONE_UPDATE: "Milestone update",
  TEAM_UPDATE: "Team update",
  CONTRIBUTION_REVIEW: "Contribution review",
  EVIDENCE_ADDED: "Evidence added",
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
  const projectId =
    notification.project?.id !== undefined && notification.project?.id !== null
      ? String(notification.project.id)
      : notification.projectId
        ? String(notification.projectId)
        : null;
  const entityId = notification.entityId;
  const data = notification.data;

  switch (notification.type) {
    case "CONTRIBUTION_REVIEW":
      if (projectId) {
        return {
          actionLabel: "View contribution",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/contributions`,
        };
      }
      break;

    case "EVIDENCE_ADDED":
      if (projectId) {
        return {
          actionLabel: "View completion",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/completion`,
        };
      }
      break;

    case "TASK_ASSIGNED":
    case "TASK_COMMENTED":
    case "TASK_DEADLINE":
    case "TASK_OVERDUE": {
      const taskId = entityId ?? data?.taskId;
      if (projectId && taskId) {
        return {
          actionLabel: "Open task",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/tasks/${encodeURIComponent(taskId)}`,
        };
      }
      break;
    }

    case "PROJECT_INVITATION":
    case "INVITATION_RESPONDED": {
      const invitationId = entityId ?? data?.invitationId;
      if (invitationId) {
        return {
          actionLabel:
            notification.type === "PROJECT_INVITATION"
              ? "Review invitation"
              : "View invitation",
          to: `/invitations/${encodeURIComponent(invitationId)}`,
        };
      }
      break;
    }

    case "JOIN_REQUEST": {
      const requestId = entityId ?? data?.joinRequestId;
      if (projectId && requestId) {
        return {
          actionLabel: "Review request",
          to: `/role-requests/${encodeURIComponent(requestId)}?project=${encodeURIComponent(projectId)}`,
        };
      }
      break;
    }

    case "JOIN_REQUEST_DECIDED": {
      const requestId = data?.joinRequestId ?? entityId;
      if (projectId && requestId) {
        return {
          actionLabel:
            data?.decision === "ACCEPTED"
              ? "Review commitment"
              : "View request",
          to: `/invitations/${encodeURIComponent(requestId)}/commitment?variant=request&project=${encodeURIComponent(projectId)}`,
        };
      }
      break;
    }

    case "MEMBER_JOINED":
    case "MEMBER_LEFT":
      if (projectId) {
        return {
          actionLabel: "View team",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/team`,
        };
      }
      break;

    case "TASK_HANDOVER_REQUEST": {
      const taskId = data?.taskId ?? entityId;
      if (projectId && taskId) {
        return {
          actionLabel: "Review request",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/tasks/${encodeURIComponent(taskId)}/reassign`,
        };
      }
      if (projectId) {
        return {
          actionLabel: "Review request",
          to: `/projects/${encodeURIComponent(projectId)}/workspace`,
        };
      }
      break;
    }

    case "TASK_HANDOVER_DECIDED": {
      const taskId = data?.taskId ?? entityId;
      if (projectId && taskId) {
        return {
          actionLabel: "View task",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/tasks/${encodeURIComponent(taskId)}`,
        };
      }
      if (projectId) {
        return {
          actionLabel: "View task",
          to: `/projects/${encodeURIComponent(projectId)}/workspace`,
        };
      }
      break;
    }

    case "TEAM_UPDATE":
      if (projectId) {
        return {
          actionLabel: "Open Updates",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/updates`,
        };
      }
      break;

    case "DATE_EXTENSION_REQUEST":
    case "DATE_EXTENSION_DECIDED": {
      const taskId = data?.taskId ?? entityId;
      if (projectId && taskId) {
        return {
          actionLabel:
            notification.type === "DATE_EXTENSION_REQUEST"
              ? "Review request"
              : "View task",
          to: `/projects/${encodeURIComponent(projectId)}/workspace/tasks/${encodeURIComponent(taskId)}`,
        };
      }
      break;
    }

    case "PROJECT_COMPLETED":
      if (projectId) {
        return {
          actionLabel: "View project page",
          to: `/projects/${encodeURIComponent(projectId)}/page`,
        };
      }
      break;

    default:
      break;
  }

  return { actionLabel: null, to: null };
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
    data: notification.data,
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

export async function markNotificationRead(id) {
  const result = await api.patch(
    `/api/notifications/${encodeURIComponent(id)}/read`,
  );
  lastSaved = lastSaved.map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
  window.dispatchEvent(new Event("notifications:changed"));
  return result;
}
