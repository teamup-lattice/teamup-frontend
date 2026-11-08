import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import listFilterIcon from "../../assets/list-filter.svg";
import { markAllNotificationsRead } from "../../services/notificationsService";
import NotificationItem from "./NotificationItem";
import styles from "./Notifications.module.css";

// Rendered once the list has loaded (or the refresh failed and we are showing
// the last saved list). Mounted with a new `key` on each retry, so its state
// starts from the freshly loaded list.
function NotificationsList({ initialItems, refreshFailed, onRetry }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialItems);
  const [markStatus, setMarkStatus] = useState("idle"); // idle | saving | success | error

  const hasItems = items.length > 0;
  const unreadCount = items.filter((item) => !item.read).length;
  const isSaving = markStatus === "saving";

  const summary = hasItems
    ? `${items.length} ${items.length === 1 ? "notification" : "notifications"} · ${unreadCount} unread`
    : "0 notifications";

  const handleMarkAll = () => {
    if (isSaving || unreadCount === 0) return;
    setMarkStatus("saving");

    markAllNotificationsRead()
      .then(() => {
        setItems((current) => current.map((item) => ({ ...item, read: true })));
        setMarkStatus("success");
      })
      .catch((error) => {
        console.error("Failed to mark notifications as read:", error);
        setMarkStatus("error");
      });
  };

  return (
    <>
      <div className={styles.summaryRow}>
        <p className={styles.summary}>{summary}</p>
        {hasItems && (
          <button
            type="button"
            className={`${styles.action} ${styles.boxed}`}
            aria-disabled={isSaving || unreadCount === 0}
            onClick={handleMarkAll}
          >
            {isSaving ? "Marking as read…" : "Mark all as read"}
          </button>
        )}
      </div>

      {refreshFailed && (
        <div className={styles.alertGroup}>
          <Alert variant="error" title="Couldn't refresh notifications">
            {hasItems
              ? "Showing your last saved list. Nothing has changed."
              : "Check your connection and try again."}
          </Alert>
          <Button variant="secondary" onClick={onRetry}>
            Retry refresh
          </Button>
        </div>
      )}

      {markStatus === "error" && (
        <div className={styles.alertGroup}>
          <Alert variant="error" title="Couldn't mark all as read">
            Nothing has changed.
          </Alert>
          <Button variant="secondary" onClick={handleMarkAll}>
            Try again
          </Button>
        </div>
      )}

      {markStatus === "success" && (
        <Alert variant="success" title="All marked as read">
          Your notifications are still here when you need them.
        </Alert>
      )}

      {hasItems && (
        <ul className={styles.list}>
          {items.map((item) => (
            <NotificationItem key={item.id} notification={item} />
          ))}
        </ul>
      )}

      {!hasItems && !refreshFailed && (
        <div className={styles.empty}>
          <img
            className={styles.emptyIcon}
            src={listFilterIcon}
            alt=""
            aria-hidden="true"
          />
          <h2 className={styles.emptyTitle}>No notifications yet</h2>
          <p className={styles.emptyText}>
            Invitations and project updates will appear here.
          </p>
          <Button onClick={() => navigate("/projects")}>Back to My Projects</Button>
        </div>
      )}
    </>
  );
}

export default NotificationsList;
