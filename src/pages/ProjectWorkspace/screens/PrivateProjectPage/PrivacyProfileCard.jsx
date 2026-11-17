import { useEffect, useRef, useState } from "react";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Checkbox from "../../../../components/Checkbox";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import styles from "./PrivateProjectPage.module.css";

function listText(items) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Team page sharing is managed on the Sharing and privacy screen. This card
// only lets the viewer change their OWN profile display choice.
//   sharing       { savedVisibility, displayOnProfile } (saved values)
//   onSave        async (displayOnProfile) => void, rejects on failure
function PrivacyProfileCard({ sharing, viewerName, otherNames, onSave, onOpenSharing }) {
  const [savedValue, setSavedValue] = useState(sharing.displayOnProfile);
  const [value, setValue] = useState(sharing.displayOnProfile);
  const [status, setStatus] = useState("idle"); // idle | saving | error | success
  const errorRef = useRef(null);

  useEffect(() => {
    if (status === "error" && errorRef.current) errorRef.current.focus();
  }, [status]);

  const savedLabel = savedValue ? "On" : "Off";
  const dirty = value !== savedValue;

  async function handleSave() {
    setStatus("saving");
    try {
      await onSave(value);
      setSavedValue(value);
      setStatus("success");
    } catch (error) {
      console.error("Failed to save profile choice:", error);
      setStatus("error");
    }
  }

  function handleChange(event) {
    setValue(event.target.checked);
    setStatus("idle");
  }

  return (
    <section className={shared.card} aria-labelledby="privacy-profile-title">
      <h3 id="privacy-profile-title" className={shared.cardTitle}>
        Privacy and profile
      </h3>
      <p className={shared.small}>
        Team page sharing{SEP}
        {sharing.savedVisibility} (saved)
      </p>
      <Button variant="secondary" fullWidth onClick={onOpenSharing}>
        Sharing settings
      </Button>

      <div className={styles.profileBox}>
        <h4 className={styles.memberName}>Your profile{SEP}{viewerName}</h4>

        {status === "error" && (
          <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
            <Alert variant="error" title="Profile choice did not save">
              Your choice is kept here. Saved profile display stays {savedLabel}. Try again.
            </Alert>
          </div>
        )}
        {status === "success" && (
          <Alert variant="success" title="Profile choice saved">
            Display on my profile is {savedLabel}.
          </Alert>
        )}

        <Checkbox
          label="Display on my profile"
          checked={value}
          onChange={handleChange}
          disabled={status === "saving"}
        />
        <p className={shared.small}>
          {savedLabel} (saved){SEP}
          {savedValue ? "Displayed on your profile." : "Not displayed on your profile."}
        </p>
        <Button
          fullWidth
          onClick={handleSave}
          loading={status === "saving"}
          loadingText="Saving..."
          disabled={!dirty && status !== "error"}
        >
          Save own profile choice
        </Button>
        <p className={shared.helper}>
          Changes your profile only.{" "}
          {otherNames.length > 0 ? `${listText(otherNames)} and team-page` : "Team-page"} sharing{" "}
          {otherNames.length > 0 ? "are" : "is"} unaffected.
        </p>
      </div>
    </section>
  );
}

export default PrivacyProfileCard;
