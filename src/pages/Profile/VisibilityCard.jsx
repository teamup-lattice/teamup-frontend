import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Checkbox from "../../components/Checkbox";
import { VISIBILITY_FIELDS } from "../../data/profileData";
import PublicPreview from "./PublicPreview";
import {
  draftSummary,
  errorMessage,
  hasChanges,
  savedSummary,
  successMessage,
} from "./visibilitySummary";
import styles from "./VisibilityCard.module.css";

function VisibilityCard({
  profile,
  project,
  saved,
  draft,
  status, // idle | saving | error | saved
  onToggle,
  onSave,
  errorRef,
}) {
  const isSaving = status === "saving";
  const fieldsHelper = hasChanges(draft, saved)
    ? draftSummary(draft, saved)
    : savedSummary(saved);
  const projectLabel = project
    ? `Display ${project.title} on my profile`
    : "Display completed projects on my profile";

  return (
    <Card aria-labelledby="visibility-title">
      <h2 id="visibility-title" className={styles.title}>
        What visitors can see
      </h2>
      <p className={styles.helper}>
        Choose the fields to display publicly. Contact stays same-team only.
      </p>

      {status === "saving" && (
        <Alert variant="info" title="Saving visibility...">
          Saved visibility remains unchanged while saving.
        </Alert>
      )}
      {status === "error" && (
        <div ref={errorRef} tabIndex={-1} className={styles.errorWrap}>
          <Alert variant="error" title="Visibility did not save">
            {errorMessage(saved)}
          </Alert>
        </div>
      )}
      {status === "saved" && (
        <Alert variant="success" title="Visibility saved">
          {successMessage(saved)}
        </Alert>
      )}

      <div role="group" aria-labelledby="visibility-title">
        {VISIBILITY_FIELDS.map((field) => (
          <Checkbox
            key={field.key}
            label={field.label}
            checked={draft[field.key]}
            onChange={() => onToggle(field.key)}
            disabled={isSaving}
          />
        ))}
      </div>
      <p className={styles.helper}>{fieldsHelper}</p>

      <h3 className={styles.subtitle}>Completed-project appearance</h3>
      <Checkbox
        label={projectLabel}
        checked={draft.showProject}
        onChange={() => onToggle("showProject")}
        disabled={isSaving}
      />
      <p className={styles.helper}>
        Saved: {saved.showProject ? "on" : "off"}. Changes your profile only;
        team-page sharing is unchanged.
      </p>

      <div className={styles.action}>
        <Button
          fullWidth
          onClick={onSave}
          loading={isSaving}
          loadingText="Saving visibility..."
        >
          {status === "error" ? "Retry visibility save" : "Save visibility"}
        </Button>
      </div>

      <PublicPreview visibility={saved} profile={profile} />
    </Card>
  );
}

export default VisibilityCard;
