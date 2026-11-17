import { useEffect, useRef, useState } from "react";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Textarea from "../../../../components/Textarea";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import { deliverableKindLabel } from "./completionHelpers";
import ReadOnlyBox from "./ReadOnlyBox";
import styles from "./ProjectCompletion.module.css";

const OUTCOME_ERROR = "Add a final outcome before completing.";

// Owner-only form for the final outcome and the project deliverable.
//   saved         last saved evidence { outcome, deliverable }
//   status        "idle" | "saving" | "error" (owned by the screen)
//   locked        true while the project is being completed
//   onSave        called with the evidence to save
//   onDirtyChange tells the screen whether local edits are unsaved
//   onCancel      tells the screen local edits were discarded
// The screen remounts this card (new key) after a successful save, so the
// local draft always starts from the saved evidence.
function EvidenceCard({ saved, status, locked, onSave, onDirtyChange, onCancel }) {
  const savedDeliverable = saved.deliverable;

  const [outcome, setOutcome] = useState(saved.outcome);
  const [label, setLabel] = useState(savedDeliverable?.label ?? "");
  const [mode, setMode] = useState("saved"); // saved | choose | file | link
  const [pickedFile, setPickedFile] = useState(null);
  const [link, setLink] = useState("");
  const [errors, setErrors] = useState({});
  const [noChange, setNoChange] = useState(false);
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);

  const isSaving = status === "saving";
  const hasError = status === "error";
  const isLocalDeliverable = mode === "file" || mode === "link";
  const evidenceSaved = saved.outcome.trim() !== "" && Boolean(savedDeliverable);
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
    setNoChange(false);
    onDirtyChange(true);
  }

  function handleOutcomeChange(event) {
    setOutcome(event.target.value);
    setErrors((current) => ({ ...current, outcome: undefined }));
    markEdited();
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
    setOutcome(saved.outcome);
    setLabel(savedDeliverable?.label ?? "");
    setMode("saved");
    setPickedFile(null);
    setLink("");
    setErrors({});
    setNoChange(false);
    onCancel();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || locked) return;

    const trimmedOutcome = outcome.trim();
    const trimmedLabel = label.trim();
    const trimmedLink = link.trim();
    const found = {};

    // Saving may not wipe an outcome that is already saved.
    if (!trimmedOutcome && saved.outcome.trim()) found.outcome = OUTCOME_ERROR;
    if (mode === "link") {
      if (!trimmedLink) {
        found.link = "Enter a project deliverable link.";
      } else if (/\s/.test(trimmedLink) || !trimmedLink.includes(".")) {
        found.link = "Enter a valid link, for example example.org/marketplace.";
      }
    }
    setErrors(found);

    const firstInvalid = ["outcome", "link"].find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(`completion-${firstInvalid}`)?.focus();
      return;
    }

    const unchanged =
      mode === "saved" &&
      trimmedOutcome === saved.outcome.trim() &&
      trimmedLabel === (savedDeliverable?.label ?? "");
    if (unchanged && !hasError) {
      setNoChange(true);
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
      };
    } else if (savedDeliverable) {
      deliverable = {
        ...savedDeliverable,
        label: trimmedLabel || savedDeliverable.label,
      };
    }

    setNoChange(false);
    onSave({ outcome: trimmedOutcome, deliverable });
  }

  const heading = (
    <>
      <h3 id="evidence-title" className={shared.cardTitle}>
        Final outcome and deliverables
      </h3>
      <p className={shared.small}>
        Required evidence{SEP}
        {evidenceSaved ? "Saved" : "Incomplete"}
      </p>
    </>
  );

  // Project is being completed: nothing can be edited.
  if (locked) {
    return (
      <section className={shared.card} aria-labelledby="evidence-title">
        {heading}
        <ReadOnlyBox label="Final outcome * (temporarily locked)">
          {saved.outcome}
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

  const showLabelInput = Boolean(savedDeliverable) || isLocalDeliverable;
  const showMissingDeliverable = !savedDeliverable && !isLocalDeliverable;
  const submitLabel = isLocalDeliverable ? "Save deliverable" : "Save outcome and deliverables";

  const errorTitle = isLocalDeliverable ? "Deliverable did not save" : "Evidence did not save";
  const deliverableState = isLocalDeliverable ? "Not attached" : "Saved";

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
            Your outcome and safe inputs are retained. No completion was submitted.
          </Alert>
        </div>
      )}

      <Textarea
        id="completion-outcome"
        label="Final outcome"
        required
        rows={4}
        placeholder="Not entered"
        value={outcome}
        onChange={handleOutcomeChange}
        error={errors.outcome ?? (outcome.trim() ? undefined : OUTCOME_ERROR)}
      />

      {showLabelInput && (
        <Input
          id="completion-label"
          label="Project deliverable label"
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
          <p className={`${shared.text} ${styles.statusLine}`}>
            {savedDeliverable.name}
            {SEP}
            {deliverableKindLabel(savedDeliverable.kind)}
            {SEP}Saved
          </p>
          <p className={shared.helper}>
            At least one project deliverable is required: a link OR a file.
          </p>
        </>
      )}

      {showMissingDeliverable && (
        <p className={`${shared.text} ${styles.missingLine}`}>
          Missing{SEP}No saved project deliverable.
        </p>
      )}

      {noChange && (
        <p className={shared.helper} role="status">
          Nothing new to save. Your outcome and deliverable are already saved.
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
          <>
            <Button variant="secondary" fullWidth onClick={openFilePicker}>
              Add file
            </Button>
            <Button variant="secondary" fullWidth onClick={startLink}>
              Add link
            </Button>
          </>
        )}

        {hasError && (
          <Button type="submit" variant="secondary" fullWidth>
            {isLocalDeliverable ? "Retry artifact save" : "Retry evidence save"}
          </Button>
        )}

        {!hasError && (
          <Button type="submit" fullWidth>
            {submitLabel}
          </Button>
        )}

        <button type="button" className={shared.linkButton} onClick={handleCancel}>
          Cancel local changes
        </button>
      </div>
    </form>
  );
}

export default EvidenceCard;
