import { useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { saveSettings } from "../../services/settingsService";
import AccountControls from "./AccountControls";
import NotificationsCard from "./NotificationsCard";
import ProfileDataCard from "./ProfileDataCard";
import { notificationOptions, onOff } from "./notificationOptions";
import styles from "./Settings.module.css";

function SettingsForm({ initialSettings }) {
  const [saved, setSaved] = useState(initialSettings);
  const [draft, setDraft] = useState({
    name: initialSettings.name,
    goals: initialSettings.goals,
    notifications: initialSettings.notifications,
  });
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | error | success
  const [savedChanges, setSavedChanges] = useState([]);
  const [nameError, setNameError] = useState("");

  const isSaving = saveStatus === "saving";

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

  function handleToggle(key, checked) {
    setDraft((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: checked },
    }));
    markEdited();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || saveStatus === "success") return;

    const name = draft.name.trim();
    if (!name) {
      setNameError("Enter your name.");
      return;
    }

    const next = { ...draft, name, goals: draft.goals.trim() };
    const changedNotifications = notificationOptions
      .filter(
        (option) =>
          next.notifications[option.key] !== saved.notifications[option.key],
      )
      .map(
        (option) =>
          `${option.label} are ${onOff(next.notifications[option.key])}.`,
      );

    setSaveStatus("saving");

    try {
      await saveSettings(next);
      setSaved({ ...next, hasSavedPreferences: true });
      setDraft(next);
      setSavedChanges(changedNotifications);
      setSaveStatus("success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
    }
  }

  let statusAlert = null;
  if (saveStatus === "saving") {
    statusAlert = (
      <Alert variant="info" title="Saving changes…">
        Keep this page open. Your previous settings are still active.
      </Alert>
    );
  } else if (saveStatus === "error") {
    statusAlert = (
      <Alert variant="error" title="Changes didn't save">
        Your edits are still here. Previous saved preferences remain active.
        Please try again.
      </Alert>
    );
  } else if (saveStatus === "success") {
    statusAlert = (
      <Alert variant="success" title="Changes saved">
        {["Your profile and notification preferences are up to date.", ...savedChanges].join(" ")}
      </Alert>
    );
  } else if (!saved.hasSavedPreferences) {
    statusAlert = (
      <Alert variant="info" title="Make these settings yours">
        No custom preferences yet. Review the defaults, then save.
      </Alert>
    );
  }

  return (
    <>
      {statusAlert}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.columns}>
          <ProfileDataCard
            values={draft}
            nameError={nameError}
            disabled={isSaving}
            onChange={handleFieldChange}
          />
          <NotificationsCard
            values={draft.notifications}
            savedValues={saved.notifications}
            hasSavedPreferences={saved.hasSavedPreferences}
            saveStatus={saveStatus}
            disabled={isSaving}
            onToggle={handleToggle}
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

      <AccountControls />
    </>
  );
}

export default SettingsForm;
