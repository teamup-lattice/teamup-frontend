import { useEffect, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import { getSharingPrivacy } from "../../services/sharingPrivacyService";
import styles from "./SharingPrivacy.module.css";

const visibilityOptions = [
  { value: "public", label: "Public", help: "Anyone can see your profile." },
  {
    value: "team",
    label: "Team only",
    help: "Only people on your projects can see it.",
  },
  { value: "private", label: "Private", help: "Only you can see your profile." },
];

function SharingPrivacy() {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSharingPrivacy()
      .then((result) => {
        if (!isMounted) return;
        setSettings(result.settings);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load privacy settings:", error);
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateSetting(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  function handleSave(event) {
    if (event) event.preventDefault();
    // Mock only: real saving will be connected to the API later
    setSaved(true);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Sharing and Profile Privacy</h1>
      <p className={styles.intro}>
        Choose who can see your profile and what you share.
      </p>

      {status === "loading" && (
        <p className={styles.intro} aria-busy="true">
          Loading your privacy settings...
        </p>
      )}

      {status === "error" && (
        <Alert variant="error" title="Privacy settings could not load">
          We could not load your settings. Check your connection and try again.
        </Alert>
      )}

      {status === "ready" && settings && (
        <form className={styles.card} onSubmit={handleSave}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>Who can see your profile</legend>
            {visibilityOptions.map((option) => (
              <label key={option.value} className={styles.option}>
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={settings.profileVisibility === option.value}
                  onChange={() =>
                    updateSetting("profileVisibility", option.value)
                  }
                />
                <span>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.helper}>{option.help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>What you share</legend>
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={settings.showEmail}
                onChange={(event) =>
                  updateSetting("showEmail", event.target.checked)
                }
              />
              <span>
                <span className={styles.optionLabel}>
                  Show my email on my profile
                </span>
                <span className={styles.helper}>
                  Teammates can contact you directly.
                </span>
              </span>
            </label>
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={settings.allowSharing}
                onChange={(event) =>
                  updateSetting("allowSharing", event.target.checked)
                }
              />
              <span>
                <span className={styles.optionLabel}>
                  Allow others to share my profile
                </span>
                <span className={styles.helper}>
                  Others can send a link to your profile.
                </span>
              </span>
            </label>
          </fieldset>

          <Button onClick={handleSave}>Save privacy settings</Button>

          {saved && (
            <p className={styles.savedMessage} role="status">
              <span aria-hidden="true">✓ </span>Privacy settings saved
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default SharingPrivacy;