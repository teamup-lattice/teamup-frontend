import { useEffect, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { getSessions } from "../../services/authService";
import { updateProfileDetails } from "../../services/profileService";
import {
  NOTIFICATION_TYPE_MAP,
  updateNotificationPreferences,
} from "../../services/settingsService";
import AccountControls from "./AccountControls";
import NotificationsCard from "./NotificationsCard";
import ProfileDataCard from "./ProfileDataCard";
import styles from "./Settings.module.css";

function getDeviceLabel(userAgent) {
  if (!userAgent) return "Unknown device";

  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("OPR/") || userAgent.includes("Opera")
      ? "Opera"
      : userAgent.includes("SamsungBrowser/")
        ? "Samsung Internet"
        : userAgent.includes("Firefox/")
          ? "Firefox"
          : userAgent.includes("Chrome/") || userAgent.includes("Chromium/")
            ? "Chrome"
            : userAgent.includes("Safari/")
              ? "Safari"
              : null;
  const os = /iPhone|iPad|iPod/i.test(userAgent)
    ? "iOS"
    : /Android/i.test(userAgent)
      ? "Android"
      : /Windows/i.test(userAgent)
        ? "Windows"
        : /Macintosh|Mac OS/i.test(userAgent)
          ? "macOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : null;

  return browser && os ? `${browser} on ${os}` : "Unknown device";
}

function formatLastUsed(value) {
  if (!value) return "Never used";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSaveErrorMessages(error) {
  const fieldErrors = Array.isArray(error.errors) ? error.errors : [];
  const skillsProfileFields = new Set([
    "weeklyAvailabilityHours",
    "preferredProjectDurationWeeks",
    "skills",
  ]);
  const hasSkillsProfileError = fieldErrors.some(({ field }) =>
    skillsProfileFields.has(field),
  );
  const otherMessages = fieldErrors
    .filter(({ field }) => !skillsProfileFields.has(field))
    .map(({ message }) => message)
    .filter(Boolean);

  return [
    ...(hasSkillsProfileError
      ? [
          "Your skills profile looks incomplete. Use Edit skills profile to fix it.",
        ]
      : []),
    ...otherMessages,
  ];
}

const defaultNotifications = {
  invitations: true,
  joinRequests: true,
  deadlineReminders: true,
  overduePrompts: true,
  roleReleasedMessages: true,
  weeklyCheckIns: true,
  ownerInactivityPrompts: true,
};

function SettingsForm({ initialSettings }) {
  const [draft, setDraft] = useState({
    name: initialSettings.name ?? "",
    goals: initialSettings.profileFields?.goals ?? "",
    notifications: {
      ...defaultNotifications,
      ...(initialSettings.notifications ?? {}),
    },
  });
  const [saved, setSaved] = useState({
    name: (initialSettings.name ?? "").trim(),
    goals: (initialSettings.profileFields?.goals ?? "").trim(),
    notifications: {
      ...defaultNotifications,
      ...(initialSettings.notifications ?? {}),
    },
    hasSavedPreferences: initialSettings.hasSavedPreferences ?? true,
  });
  const [nameError, setNameError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | error | success
  const [saveErrorMessages, setSaveErrorMessages] = useState([]);
  const [sessionsAttempt, setSessionsAttempt] = useState(0);
  const [sessionsResult, setSessionsResult] = useState({
    attempt: null,
    status: "loading",
    sessions: [],
  });
  const [isShowingAllSessions, setIsShowingAllSessions] = useState(false);

  const isSaving = saveStatus === "saving";
  const sessionsStatus =
    sessionsResult.attempt === sessionsAttempt
      ? sessionsResult.status
      : "loading";
  const sessions = sessionsResult.sessions;
  const visibleSessions = (() => {
    if (isShowingAllSessions || sessions.length <= 5) return sessions;

    const visible = sessions.slice(0, 5);
    const currentSessionIndex = sessions.findIndex(
      (session) => session.current,
    );

    if (currentSessionIndex >= 5) {
      visible[4] = sessions[currentSessionIndex];
      visible.sort(
        (first, second) => sessions.indexOf(first) - sessions.indexOf(second),
      );
    }

    return visible;
  })();

  useEffect(() => {
    let isMounted = true;

    getSessions()
      .then((sessions) => {
        if (isMounted) {
          setSessionsResult({
            attempt: sessionsAttempt,
            status: "ready",
            sessions,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load sessions:", error);
        if (isMounted) {
          setSessionsResult({
            attempt: sessionsAttempt,
            status: "error",
            sessions: [],
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionsAttempt]);

  function markEdited() {
    // Editing after a successful save starts a new set of unsaved changes.
    setSaveStatus((status) => (status === "success" ? "idle" : status));
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    if (name === "name") setNameError("");
    markEdited();
  }

  function handleNotificationToggle(key, checked) {
    setDraft((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: checked },
    }));
    markEdited();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || saveStatus === "success") return;

    const trimmedName = (draft.name ?? "").trim();
    const trimmedGoals = (draft.goals ?? "").trim();

    if (!trimmedName) {
      setNameError("Name can't be empty");
      return;
    }
    if (trimmedName.length > 100) {
      setNameError("Name can't be more than 100 characters");
      return;
    }
    if (trimmedGoals.length > 2000) {
      setSaveErrorMessages(["Goals can't be more than 2000 characters."]);
      setSaveStatus("error");
      return;
    }

    const profileChanges = {};
    if (trimmedName !== saved.name) profileChanges.name = trimmedName;
    if (trimmedGoals !== saved.goals) profileChanges.goals = trimmedGoals || null;

    const changedPreferences = [];
    for (const [key, type] of Object.entries(NOTIFICATION_TYPE_MAP)) {
      if (draft.notifications[key] !== saved.notifications[key]) {
        changedPreferences.push({
          type,
          channel: "IN_APP",
          enabled: Boolean(draft.notifications[key]),
        });
      }
    }

    const hasAnyDraftChanges =
      Object.keys(profileChanges).length > 0 ||
      changedPreferences.length > 0 ||
      Object.keys(draft.notifications).some(
        (key) => draft.notifications[key] !== saved.notifications[key],
      );

    setNameError("");
    setSaveErrorMessages([]);

    if (!hasAnyDraftChanges) {
      setSaveStatus("success");
      return;
    }

    setSaveStatus("saving");

    try {
      const promises = [];
      if (Object.keys(profileChanges).length > 0) {
        promises.push(updateProfileDetails(profileChanges));
      }
      if (changedPreferences.length > 0) {
        promises.push(updateNotificationPreferences(changedPreferences));
      }
      await Promise.all(promises);

      setSaved({
        name: trimmedName,
        goals: trimmedGoals,
        notifications: { ...draft.notifications },
        hasSavedPreferences: true,
      });
      setDraft((current) => ({
        ...current,
        name: trimmedName,
        goals: trimmedGoals,
      }));
      setSaveStatus("success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      const nameFieldError = Array.isArray(error.errors)
        ? error.errors.find(({ field }) => field === "name")
        : null;
      if (nameFieldError?.message) setNameError(nameFieldError.message);

      const messages = getSaveErrorMessages(error);
      if (error.status === 401) {
        setSaveErrorMessages(["You must be signed in to save changes."]);
      } else if (error.status === 400) {
        setSaveErrorMessages(
          messages.length
            ? messages
            : [
                error.message ||
                  "Invalid settings data provided. Please check your inputs.",
              ],
        );
      } else {
        setSaveErrorMessages(
          messages.length ? messages : error.message ? [error.message] : [],
        );
      }
      setSaveStatus("error");
    }
  }

  let statusAlert = null;
  if (saveStatus === "saving") {
    statusAlert = (
      <Alert variant="info" title="Saving changes…">
        Keep this page open. Your previous saved preferences remain active.
      </Alert>
    );
  } else if (saveStatus === "error") {
    statusAlert = (
      <Alert variant="error" title="Changes didn't save">
        Your edits are still here. Previous saved preferences remain active.
        Please try again. {saveErrorMessages.join(" ")}
      </Alert>
    );
  } else if (saveStatus === "success") {
    statusAlert = (
      <Alert variant="success" title="Changes saved">
        Your profile and preferences are up to date.
      </Alert>
    );
  }

  return (
    <>
      {statusAlert}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.columns}>
          <ProfileDataCard
            values={{
              name: initialSettings.name,
              avatarUrl: initialSettings.avatarUrl,
              ...draft,
              nameError,
            }}
            disabled={isSaving}
            onChange={handleFieldChange}
          />
          <NotificationsCard
            values={draft.notifications}
            savedValues={saved.notifications}
            hasSavedPreferences={saved.hasSavedPreferences}
            saveStatus={saveStatus}
            disabled={isSaving}
            onToggle={handleNotificationToggle}
          />
        </div>

        <div className={styles.saveRow}>
          {saveStatus === "success" ? (
            <Button variant="success" aria-disabled="true">
              ✓ Changes saved
            </Button>
          ) : (
            <Button
              type="submit"
              loading={isSaving}
              loadingText="Saving changes…"
            >
              {saveStatus === "error" ? "Retry save changes" : "Save changes"}
            </Button>
          )}
          <p className={styles.helper}>
            {isSaving
              ? "Saving profile and preferences"
              : "Saves profile and notification choices"}
          </p>
        </div>
      </form>

      <section className={styles.card} aria-labelledby="devices-heading">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle} id="devices-heading">
            Devices
          </h2>
          <p className={styles.cardDescription}>
            Review where you&apos;re signed in.
          </p>
        </div>

        {sessionsStatus === "loading" && (
          <div aria-busy="true">
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonBlock} />
            <span className={styles.skeletonBlock} />
          </div>
        )}

        {sessionsStatus === "error" && (
          <>
            <Alert variant="error" title="Devices could not load">
              Check your connection and try again.
            </Alert>
            <Button
              onClick={() => setSessionsAttempt((attempt) => attempt + 1)}
            >
              Retry
            </Button>
          </>
        )}

        {sessionsStatus === "ready" &&
          (sessions.length === 0 ? (
            <p className={styles.fieldText}>No active sessions</p>
          ) : (
            <>
              <ul className={styles.notificationList}>
                {visibleSessions.map((session) => (
                  <li className={styles.notificationItem} key={session.id}>
                    <p className={styles.fieldText}>
                      <strong>{getDeviceLabel(session.userAgent)}</strong>
                      {session.current && (
                        <span className={styles.helper}> · This device</span>
                      )}
                    </p>
                    <p className={styles.helper}>
                      Last active {formatLastUsed(session.lastUsedAt)} · IP{" "}
                      {session.ipAddress || "Unavailable"}
                    </p>
                  </li>
                ))}
              </ul>
              {sessions.length > 5 && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setIsShowingAllSessions((showingAll) => !showingAll)
                  }
                >
                  {isShowingAllSessions
                    ? "Show less"
                    : `Show all (${sessions.length})`}
                </Button>
              )}
            </>
          ))}
      </section>

      <AccountControls />
    </>
  );
}

export default SettingsForm;
