import { useEffect, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { getSettings } from "../../services/settingsService";
import { getErrorMessage } from "../../services/errorMessage";
import SettingsForm from "./SettingsForm";
import styles from "./Settings.module.css";

function Settings() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({
    key: null,
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((data) => {
        if (isMounted)
          setResult({ key: attempt, status: "ready", data, error: null });
      })
      .catch((error) => {
        console.error("Failed to load settings:", error);
        if (isMounted)
          setResult({ key: attempt, status: "error", data: null, error });
      });

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  const status = result.key === attempt ? result.status : "loading";
  const loadError = result.key === attempt ? result.error : null;

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
              <span
                className={`${styles.skeletonLine} ${styles.skeletonShort}`}
              />
              <span className={styles.skeletonBlock} />
              <span className={styles.skeletonBlock} />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div>
          <Alert
            variant="error"
            title={
              loadError?.status === 401
                ? "You must be signed in"
                : loadError?.status === 400
                  ? "Settings request failed"
                  : "Settings could not load"
            }
          >
            {getErrorMessage(loadError, {
              fallback: "Settings could not load. Please try again.",
              byStatus: {
                401: "Please sign in to view and change your settings.",
                400:
                  loadError?.message ||
                  "Invalid settings request. Check your details and try again.",
              },
            })}
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
