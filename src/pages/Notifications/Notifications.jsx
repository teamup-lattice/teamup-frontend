import { useEffect, useState } from "react";
import {
  getLastSavedNotifications,
  getNotifications,
} from "../../services/notificationsService";
import NotificationsList from "./NotificationsList";
import styles from "./Notifications.module.css";

function Notifications() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, status: "loading", items: [] });

  useEffect(() => {
    let isMounted = true;

    getNotifications()
      .then((items) => {
        if (isMounted) setResult({ key: attempt, status: "ready", items });
      })
      .catch((error) => {
        console.error("Failed to load notifications:", error);
        if (isMounted) {
          setResult({
            key: attempt,
            status: "error",
            items: getLastSavedNotifications(),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  const status = result.key === attempt ? result.status : "loading";

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Notifications</h1>
      <p className={styles.description}>
        Your invitations, updates and gentle reminders.
      </p>

      {status === "loading" ? (
        <div aria-busy="true">
          <p className={styles.loadingText} role="status">
            Loading your notifications…
          </p>
          {[0, 1, 2].map((index) => (
            <div className={styles.skeletonCard} aria-hidden="true" key={index}>
              <span className={`${styles.skeletonBar} ${styles.skeletonWide}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonTall}`} />
              <span className={`${styles.skeletonBar} ${styles.skeletonShort}`} />
            </div>
          ))}
        </div>
      ) : (
        <NotificationsList
          key={attempt}
          initialItems={result.items}
          refreshFailed={status === "error"}
          onRetry={() => setAttempt((count) => count + 1)}
        />
      )}

      <p className={styles.footer}>
        Choose what you receive in Settings → Notifications.
      </p>
    </div>
  );
}

export default Notifications;
