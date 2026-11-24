import { Link, useNavigate } from "react-router-dom";
import { markNotificationRead } from "../../services/notificationsService";
import styles from "./Notifications.module.css";

function NotificationItem({ notification, onMarkAsRead }) {
  const navigate = useNavigate();
  const { type, message, project, ownerOnly, time, read, actionLabel, to } =
    notification;
  const meta = [project, ownerOnly ? "Owner only" : null, time]
    .filter(Boolean)
    .join(" · ");

  const handleOpen = () => {
    if (!read) {
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      } else {
        markNotificationRead(notification.id).catch((error) => {
          console.error("Failed to mark notification as read:", error);
        });
      }
    }
  };

  const handleRowClick = () => {
    if (to) {
      handleOpen();
      navigate(to);
    }
  };

  const handleActionClick = (event) => {
    event.stopPropagation();
    handleOpen();
  };

  return (
    <li
      className={`${styles.item} ${read ? "" : styles.unread}`}
      onClick={handleRowClick}
      style={to ? { cursor: "pointer" } : undefined}
    >
      <div className={styles.itemBody}>
        <p className={`${styles.kind} ${read ? "" : styles.kindUnread}`}>
          {!read && <span className={styles.dot} aria-hidden="true" />}
          {read ? "Read" : "Unread"} · {type}
        </p>
        <p className={`${styles.message} ${read ? "" : styles.messageUnread}`}>
          {message}
        </p>
        <p className={styles.meta}>{meta}</p>
      </div>
      {to && actionLabel && (
        <Link
          to={to}
          className={styles.action}
          aria-label={`${actionLabel}: ${message}`}
          onClick={handleActionClick}
        >
          {actionLabel}
        </Link>
      )}
    </li>
  );
}

export default NotificationItem;
