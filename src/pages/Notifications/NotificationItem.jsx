import { Link } from "react-router-dom";
import styles from "./Notifications.module.css";

function NotificationItem({ notification }) {
  const { type, message, project, ownerOnly, time, read, actionLabel, to } =
    notification;
  const meta = [project, ownerOnly ? "Owner only" : null, time]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={`${styles.item} ${read ? "" : styles.unread}`}>
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
      <Link
        to={to}
        className={`${styles.action} ${read ? "" : styles.boxed}`}
        aria-label={`${actionLabel}: ${message}`}
      >
        {actionLabel}
      </Link>
    </li>
  );
}

export default NotificationItem;
