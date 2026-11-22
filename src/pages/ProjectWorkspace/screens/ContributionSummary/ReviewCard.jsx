import { useEffect, useRef, useState } from "react";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Textarea from "../../../../components/Textarea";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import ReadOnlyBox from "../ProjectCompletion/ReadOnlyBox";
import styles from "./ContributionSummary.module.css";

export const SUMMARY_MAX = 140;
export const NOTE_MAX = 280;

// The member's own contribution wording.
//   saved        { summary, note } last saved values
//   locked       true once the wording is reviewed or confirmed (read only)
//   lockedReason "reviewed" | "confirmed"
//   status       "idle" | "saving" | "error" (owned by the screen)
//   onSave       called with { summary, note }
//   onCancel     leaves without saving; saved wording stays unchanged
function ReviewCard({
  saved,
  locked,
  lockedReason = "confirmed",
  taskCount,
  reviewer,
  status,
  onSave,
  onCancel,
}) {
  const [summary, setSummary] = useState(saved.summary);
  const [note, setNote] = useState(saved.note);
  const [errors, setErrors] = useState({});
  const errorRef = useRef(null);

  const isSaving = status === "saving";
  const hasError = status === "error";

  useEffect(() => {
    if (hasError && errorRef.current) errorRef.current.focus();
  }, [hasError]);

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!summary.trim()) nextErrors.summary = "Add a short summary of your contribution.";
    else if (summary.trim().length > SUMMARY_MAX) {
      nextErrors.summary = `Keep the summary to ${SUMMARY_MAX} characters or fewer.`;
    }
    if (note.trim().length > NOTE_MAX) {
      nextErrors.note = `Keep the note to ${NOTE_MAX} characters or fewer.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave({ summary: summary.trim(), note: note.trim() });
  }

  if (locked) {
    const reason = lockedReason === "confirmed" ? "confirmed" : "reviewed";
    return (
      <section className={shared.card} aria-labelledby="own-wording-title">
        <h3 id="own-wording-title" className={shared.cardTitle}>
          Your contribution wording
        </h3>
        <ReadOnlyBox label={`Summary (${reason}, read only)`}>{saved.summary}</ReadOnlyBox>
        {saved.note && (
          <ReadOnlyBox label={`Note (${reason}, read only)`}>{saved.note}</ReadOnlyBox>
        )}
        <p className={shared.small}>
          {lockedReason === "confirmed"
            ? "Confirmed wording is locked. Saved task ownership and history are unchanged."
            : "Your wording is saved and waiting for a teammate."}
        </p>
      </section>
    );
  }

  return (
    <form className={shared.card} onSubmit={handleSubmit} noValidate aria-labelledby="own-wording-title">
      <h3 id="own-wording-title" className={shared.cardTitle}>
        Your contribution wording
      </h3>
      <p className={shared.small}>
        Based on your {taskCount} saved Done {taskCount === 1 ? "task" : "tasks"}
        {SEP}
        {reviewer} confirms the wording only, not impact.
      </p>

      <div className={styles.formStack}>
        <Textarea
          id="contribution-summary"
          label="Contribution summary"
          required
          rows={3}
          value={summary}
          maxLength={SUMMARY_MAX + 40}
          onChange={(event) => {
            setSummary(event.target.value);
            setErrors((current) => ({ ...current, summary: undefined }));
          }}
          error={errors.summary}
          helperText={`${summary.trim().length}/${SUMMARY_MAX} characters`}
          disabled={isSaving}
        />
        <Textarea
          id="contribution-note"
          label="Note for your teammate (optional)"
          rows={3}
          value={note}
          maxLength={NOTE_MAX + 40}
          onChange={(event) => {
            setNote(event.target.value);
            setErrors((current) => ({ ...current, note: undefined }));
          }}
          error={errors.note}
          helperText="Context a teammate needs to check the wording."
          disabled={isSaving}
        />
      </div>

      {hasError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          className={`${shared.errorWrap} ${styles.errorSpace}`}
        >
          <Alert variant="error" title="Couldn't save your review">
            Your wording is still here. Check your connection and try again.
          </Alert>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="submit"
          loading={isSaving}
          loadingText="Saving…"
        >
          {hasError ? "Retry save" : "Save as Reviewed"}
        </Button>
        <Button variant="secondary" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <p className={shared.small}>Cancel leaves your saved wording unchanged.</p>
    </form>
  );
}

export default ReviewCard;
