import { useEffect, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { getSettings } from "../../services/settingsService";
import SettingsForm from "./SettingsForm";
import styles from "./Settings.module.css";

function Settings() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, status: "loading", data: null });

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((data) => {
        if (isMounted) setResult({ key: attempt, status: "ready", data });
      })
      .catch((error) => {
        console.error("Failed to load settings:", error);
        if (isMounted) setResult({ key: attempt, status: "error", data: null });
      });

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  const status = result.key === attempt ? result.status : "loading";

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>Settings</h1>
        <p className={styles.description}>
          Your profile, your notifications, your choices.
        </p>
      </div>

      {status === "loading" && (
        <div className={styles.columns} aria-busy="true">
          {[0, 1].map((index) => (
            <div className={styles.card} aria-hidden="true" key={index}>
              <span className={styles.skeletonLine} />
              <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
              <span className={styles.skeletonBlock} />
              <span className={styles.skeletonBlock} />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div>
          <Alert variant="error" title="Settings could not load">
            Check your connection and try again.
          </Alert>
          <Button onClick={() => setAttempt((count) => count + 1)}>
            Try again
          </Button>
        </div>
      )}

      {status === "ready" && <SettingsForm initialSettings={result.data} />}
    </div>
  );
}

export default Settings;
