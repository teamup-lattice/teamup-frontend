import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import { ArrowUpRightIcon, PaperclipIcon, TrashIcon } from "../../../../components/Icons";
import Input from "../../../../components/Input";
import Textarea from "../../../../components/Textarea";
import { getErrorMessage } from "../../../../services/errorMessage";
import { deleteProjectEvidence } from "../../../../services/evidenceService";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import ReadOnlyBox from "./ReadOnlyBox";
import styles from "./ProjectCompletion.module.css";

const OUTCOME_ERROR = "Add a final outcome before completing.";

// Owner-only form for the final outcome and the project deliverable.
//   saved         saved deliverable { deliverable }
//   outcome       local final outcome, sent only when completing
//   status        "idle" | "saving" | "error" (owned by the screen)
//   locked        true while the project is being completed
//   onOutcomeChange updates the local final outcome
//   onSave        called with the deliverable to save
//   onDirtyChange tells the screen whether local edits are unsaved
//   onCancel      tells the screen local edits were discarded
// The screen remounts this card (new key) after a successful save, so the
// local draft always starts from the saved evidence.
function EvidenceCard({
  saved,
  outcome,
  status,
  locked,
  onOutcomeChange,
  onSave,
  onDirtyChange,
  onCancel,
}) {
  const { projectId } = useParams();
  const [removed, setRemoved] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const savedDeliverable = removed ? null : saved.deliverable;

  const [label, setLabel] = useState(savedDeliverable?.label ?? "");
  const [mode, setMode] = useState("saved"); // saved | choose | file | link
  const [pickedFile, setPickedFile] = useState(null);
  const [link, setLink] = useState("");
  const [errors, setErrors] = useState({});
  const [outcomeTouched, setOutcomeTouched] = useState(false);
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);

  const isSaving = status === "saving";
  const hasError = status === "error";
  const isLocalDeliverable = mode === "file" || mode === "link";
  const evidenceSaved = outcome.trim() !== "" && Boolean(savedDeliverable);
  const pendingName =
    mode === "file" && pickedFile
      ? pickedFile.name
      : mode === "link"
        ? link.trim()
        : (savedDeliverable?.name ?? "");

  useEffect(() => {
    if (hasError && errorRef.current) errorRef.current.focus();
  }, [hasError]);

  function markEdited() {
    onDirtyChange(true);
  }

  function handleOutcomeChange(event) {
    onOutcomeChange(event.target.value);
    setErrors((current) => ({ ...current, outcome: undefined }));
  }

  function handleLabelChange(event) {
    setLabel(event.target.value);
    markEdited();
  }

  function handleLinkChange(event) {
    setLink(event.target.value);
    setErrors((current) => ({ ...current, link: undefined }));
    markEdited();
  }

  function openFilePicker() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleFilePicked(event) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;
    setPickedFile(file);
    setMode("file");
    setErrors({});
    markEdited();
  }

  function startLink() {
    setMode("link");
    setErrors({});
    markEdited();
  }

  function handleCancel() {
    setLabel(savedDeliverable?.label ?? "");
    setMode("saved");
    setPickedFile(null);
    setLink("");
    setErrors({});
    setOutcomeTouched(false);
    onCancel();
  }

  function startRemove() {
    setRemoveError("");
    setIsConfirmingRemove(true);
  }

  function cancelRemove() {
    if (isRemoving) return;
    setIsConfirmingRemove(false);
    setRemoveError("");
  }

  async function handleRemove() {
    if (isRemoving) return;
    if (!projectId || !savedDeliverable?.id) {
      setRemoveError("This deliverable cannot be removed.");
      return;
    }

    setIsRemoving(true);
    setRemoveError("");
    try {
      await deleteProjectEvidence(projectId, savedDeliverable.id);
      setRemoved(true);
      setIsConfirmingRemove(false);
      setMode("saved");
      setPickedFile(null);
      setLink("");
      setLabel("");
      setErrors({});
      onCancel();
    } catch (error) {
      console.error("Failed to remove deliverable:", error);
      setRemoveError(
        getErrorMessage(error, {
          fallback: "Could not remove this deliverable. Try again.",
        }),
      );
    } finally {
      setIsRemoving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || locked) return;
    if (!isLocalDeliverable) return;

    const trimmedLabel = label.trim();
    const trimmedLink = link.trim();
    const found = {};

    if (mode === "link") {
      if (!trimmedLink) {
        found.link = "Enter a project deliverable link.";
      } else if (/\s/.test(trimmedLink) || !trimmedLink.includes(".")) {
        found.link = "Enter a valid link, for example example.org/marketplace.";
      }
    }
    setErrors(found);

    const firstInvalid = ["link"].find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(`completion-${firstInvalid}`)?.focus();
      return;
    }

    let deliverable = null;
    if (mode === "file" && pickedFile) {
      deliverable = {
        kind: "file",
        label: trimmedLabel || pickedFile.name,
        name: pickedFile.name,
        file: pickedFile,
      };
    } else if (mode === "link") {
      deliverable = {
        kind: "link",
        label: trimmedLabel || trimmedLink,
        name: trimmedLink,
        url: trimmedLink,
      };
    }

    if (!deliverable) return;
    onSave({ deliverable });
  }

  const heading = (
    <>
      <h3 id="evidence-title" className={shared.cardTitle}>
        Final outcome and deliverables
      </h3>
      <div className={styles.evidenceStatusRow}>
        <span className={styles.evidenceStatusLabel}>Required evidence</span>
        <span
          className={`${styles.statusPill} ${
            evidenceSaved ? styles.statusPillOn : styles.statusPillIncomplete
          }`}
        >
          {evidenceSaved ? "Complete" : "Incomplete"}
        </span>
      </div>
    </>
  );

  // Project is being completed: nothing can be edited.
  if (locked) {
    return (
      <section className={shared.card} aria-labelledby="evidence-title">
        {heading}
        <ReadOnlyBox label="Final outcome * (temporarily locked)">
          {outcome}
        </ReadOnlyBox>
        {savedDeliverable && (
          <p className={`${shared.text} ${styles.statusLine}`}>
            {savedDeliverable.name}
            {SEP}Saved
          </p>
        )}
      </section>
    );
  }

  // Evidence is being saved: edits and repeat submission are locked.
  if (isSaving) {
    return (
      <section className={shared.card} aria-labelledby="evidence-title" aria-busy="true">
        {heading}
        <ReadOnlyBox label="Final outcome * (temporarily locked)">
          {outcome.trim()}
        </ReadOnlyBox>
        {pendingName && (
          <p className={`${shared.text} ${styles.statusLine}`}>
            {pendingName}
            {SEP}Saving, not saved
          </p>
        )}
        <Button fullWidth loading loadingText="Saving evidence..." />
      </section>
    );
  }

  const showLabelInput = isLocalDeliverable;
  const showMissingDeliverable = !savedDeliverable && !isLocalDeliverable;
  const submitLabel = "Save deliverable";

  const errorTitle = "Deliverable did not save";
  const deliverableState = isLocalDeliverable ? "Not attached" : "Saved";
  const outcomeError =
    errors.outcome ??
    (outcomeTouched && outcome.trim() === "" ? OUTCOME_ERROR : undefined);

  return (
    <form
      className={shared.card}
      aria-labelledby="evidence-title"
      onSubmit={handleSubmit}
      noValidate
    >
      {heading}

      {hasError && (
        <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
          <Alert variant="error" title={errorTitle}>
            Your final outcome and safe inputs are retained. No completion was submitted.
          </Alert>
        </div>
      )}

      <div className={styles.outcomeField}>
        <Textarea
          id="completion-outcome"
          label="Final outcome"
          required
          rows={4}
          maxLength={5000}
          placeholder="Not entered"
          value={outcome}
          onChange={handleOutcomeChange}
          onBlur={() => setOutcomeTouched(true)}
          helperText={`${outcome.length}/5000 characters`}
          error={outcomeError}
        />
      </div>

      {showLabelInput && (
        <Input
          id="completion-label"
          label="Project deliverable label"
          maxLength={150}
          value={label}
          onChange={handleLabelChange}
        />
      )}

      {mode === "link" && (
        <Input
          id="completion-link"
          label="Project deliverable link"
          required
          inputMode="url"
          autoComplete="off"
          value={link}
          onChange={handleLinkChange}
          error={errors.link}
          helperText="Link not saved. Save at least one file or link."
        />
      )}

      {mode === "file" && pickedFile && (
        <p className={`${shared.text} ${styles.statusLine}`}>
          {pickedFile.name}
          {SEP}
          {hasError ? deliverableState : "Selected locally"}
        </p>
      )}

      {mode === "link" && hasError && (
        <p className={`${shared.text} ${styles.statusLine}`}>
          {link.trim()}
          {SEP}
          {deliverableState}
        </p>
      )}

      {!isLocalDeliverable && savedDeliverable && (
        <>
          <div className={styles.savedRow}>
            <span className={styles.savedRowIcon} aria-hidden="true">
              {savedDeliverable.kind === "link" ? (
                <ArrowUpRightIcon />
              ) : (
                <PaperclipIcon />
              )}
            </span>
            <span className={styles.savedRowName}>{savedDeliverable.name}</span>
            <span className={`${styles.statusPill} ${styles.statusPillOn}`}>
              Saved
            </span>
            {!isConfirmingRemove && (
              <button
                type="button"
                className={styles.removeRowButton}
                disabled={isSaving || locked || isRemoving}
                onClick={startRemove}
              >
                <TrashIcon />
                <span>Remove</span>
              </button>
            )}
          </div>
          {isConfirmingRemove && (
            <div className={styles.removeConfirm}>
              <p className={styles.removePrompt}>Remove this deliverable?</p>
              <div className={styles.removeActions}>
                <button
                  type="button"
                  className={`${styles.textButton} ${styles.cancelButton}`}
                  disabled={isRemoving}
                  onClick={cancelRemove}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.textButton} ${styles.removeButton}`}
                  aria-busy={isRemoving}
                  disabled={isSaving || locked || isRemoving}
                  onClick={handleRemove}
                >
                  {isRemoving ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          )}
          {removeError && (
            <div className={styles.removeError}>
              <Alert variant="error" title="Remove failed">
                {removeError}
              </Alert>
            </div>
          )}
          <p className={styles.smallHelper}>
            At least one project deliverable is required: a link OR a file.
          </p>
        </>
      )}

      {showMissingDeliverable && (
        <p className={`${shared.text} ${styles.missingLine}`}>
          Missing{SEP}No saved project deliverable.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFilePicked}
      />

      <div className={shared.stack}>
        {mode === "file" && (
          <Button variant="secondary" fullWidth onClick={openFilePicker}>
            Choose another file
          </Button>
        )}

        {showMissingDeliverable && mode === "saved" && (
          <Button variant="secondary" fullWidth onClick={() => setMode("choose")}>
            Add file or link
          </Button>
        )}

        {(mode === "choose" || (mode === "saved" && savedDeliverable)) && (
          <div className={styles.addRow}>
            <Button variant="secondary" onClick={openFilePicker}>
              <PaperclipIcon />
              Add file
            </Button>
            <Button variant="secondary" onClick={startLink}>
              <ArrowUpRightIcon />
              Add link
            </Button>
          </div>
        )}

        {hasError && isLocalDeliverable && (
          <Button type="submit" variant="secondary" fullWidth>
            Retry deliverable save
          </Button>
        )}

        {!hasError && isLocalDeliverable && (
          <Button type="submit" fullWidth>
            {submitLabel}
          </Button>
        )}

        <button
          type="button"
          className={styles.cancelChanges}
          onClick={handleCancel}
        >
          Cancel local changes
        </button>
      </div>
    </form>
  );
}

export default EvidenceCard;
