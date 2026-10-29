import { useContext, useState } from "react";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { WizardContext } from "./WizardContextValue";
import styles from "./MilestonesStep.module.css";

function MilestonesStep() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("MilestonesStep must be used within a WizardProvider.");
  }

  const {
    milestones,
    setMilestones,
    draftId,
    saveStatus,
    setSaveStatus,
    saveDraft,
    goNext,
    goBack,
    markStepIncomplete,
  } = context;

  const [showValidation, setShowValidation] = useState(false);
  const [milestoneToRemove, setMilestoneToRemove] = useState(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: "", date: "" });
  const [newMilestoneError, setNewMilestoneError] = useState(false);

  const isSaving = saveStatus === "saving";

  const updateMilestone = (id, field, value) => {
    setMilestones((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleKeepNewMilestone = () => {
    if (!newMilestone.name.trim() || !newMilestone.date.trim()) {
      setNewMilestoneError(true);
      return;
    }

    const created = {
      id: `milestone-${Date.now()}`,
      name: newMilestone.name.trim(),
      date: newMilestone.date.trim(),
    };

    setMilestones((current) => [...current, created]);
    setNewMilestone({ name: "", date: "" });
    setNewMilestoneError(false);
    setIsAddingMilestone(false);
  };

  const confirmRemoveMilestone = (id) => {
    setMilestones((current) => current.filter((item) => item.id !== id));
    setMilestoneToRemove(null);
  };

  // Validation
  const hasAtLeastOneComplete = milestones.some(
    (m) => m.name?.trim() && m.date?.trim(),
  );

  const milestonesMissingDate = milestones.filter(
    (m) => m.name?.trim() && (!m.date || !m.date.trim()),
  );

  const milestonesMissingName = milestones.filter(
    (m) => m.date?.trim() && (!m.name || !m.name.trim()),
  );

  const handleContinue = () => {
    setShowValidation(true);
    if (!hasAtLeastOneComplete || milestonesMissingDate.length > 0 || milestonesMissingName.length > 0) {
      markStepIncomplete(4);
      if (milestones.length === 0) {
        document.getElementById("new-milestone-name")?.focus();
      } else if (milestonesMissingDate.length > 0) {
        document
          .getElementById(`milestone-date-${milestonesMissingDate[0].id}`)
          ?.focus();
      } else if (milestonesMissingName.length > 0) {
        document
          .getElementById(`milestone-name-${milestonesMissingName[0].id}`)
          ?.focus();
      }
      return;
    }

    goNext();
  };

  // Build validation alert
  let validationAlert = null;
  if (showValidation) {
    if (milestones.length === 0) {
      validationAlert = (
        <Alert variant="error" title="Add a milestone">
          <>
            At least one named milestone with a target date is required to
            continue.
            <br />
            <a
              className={styles.focusLink}
              href="#new-milestone-name"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("new-milestone-name")?.focus();
              }}
            >
              Go to milestone name
            </a>
          </>
        </Alert>
      );
    } else if (milestonesMissingDate.length > 0) {
      const target = milestonesMissingDate[0];
      const milestoneName = target.name || "Milestone";
      validationAlert = (
        <Alert variant="error" title={`${milestoneName} needs a date`}>
          <>
            Add its target date. Milestone names and other dates are kept.
            <br />
            <a
              className={styles.focusLink}
              href={`#milestone-date-${target.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`milestone-date-${target.id}`)
                  ?.focus();
              }}
            >
              Go to {milestoneName} target date
            </a>
          </>
        </Alert>
      );
    } else if (milestonesMissingName.length > 0) {
      const target = milestonesMissingName[0];
      validationAlert = (
        <Alert variant="error" title="Add milestone name">
          <>
            Add a name for this milestone. Target date is kept.
            <br />
            <a
              className={styles.focusLink}
              href={`#milestone-name-${target.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`milestone-name-${target.id}`)
                  ?.focus();
              }}
            >
              Go to milestone name
            </a>
          </>
        </Alert>
      );
    }
  }

  return (
    <section className={styles.card} aria-labelledby="milestones-heading">
      <span className={styles.badge}>
        {draftId ? "Draft" : "New · unsaved"}
      </span>
      <h1 id="milestones-heading" className={styles.heading}>
        Create milestones
      </h1>
      <p className={styles.description}>Set your team&apos;s milestones.</p>
      <p className={styles.localChanges}>
        {saveStatus === "saved"
          ? "All changes saved."
          : "Local changes · not saved yet."}
      </p>

      {validationAlert}

      {saveStatus === "saving" && (
        <Alert variant="info" title="Saving milestones...">
          Saving milestones. Entries retained; save temporarily locked.
        </Alert>
      )}
      {saveStatus === "saved" && (
        <Alert variant="success" title="Draft saved">
          One dated milestone meets the minimum; more are optional.
        </Alert>
      )}
      {saveStatus === "failed" && (
        <Alert variant="error" title="Draft did not save">
          Save failed. Saved draft unchanged; local entries retained. Retry.
        </Alert>
      )}

      <Alert variant="info" title="One dated milestone is enough">
        At least one named, dated milestone required; two recommended.
      </Alert>

      <div className={styles.fields}>
        {milestones.length === 0 && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyHeader}>
              <h2 className={styles.emptyTitle}>No milestones yet</h2>
              <p className={styles.emptyDescription}>
                Add a milestone name and target date.
              </p>
            </div>

            <div className={styles.formInsideCard}>
              <h3 className={styles.newMilestoneTitle}>New milestone</h3>
              <Input
                id="new-milestone-name"
                label="Milestone name"
                required
                placeholder="e.g. Requirements"
                value={newMilestone.name}
                onChange={(e) => {
                  setNewMilestone((prev) => ({ ...prev, name: e.target.value }));
                  setSaveStatus("idle");
                }}
                error={
                  (showValidation || newMilestoneError) &&
                  !newMilestone.name.trim()
                    ? "! Add a milestone name."
                    : undefined
                }
                disabled={isSaving}
              />
              <Input
                id="new-milestone-date"
                label="Target date"
                required
                type="date"
                value={newMilestone.date}
                onChange={(e) => {
                  setNewMilestone((prev) => ({ ...prev, date: e.target.value }));
                  setSaveStatus("idle");
                }}
                error={
                  (showValidation || newMilestoneError) &&
                  !newMilestone.date.trim()
                    ? "! Add a target date."
                    : undefined
                }
                disabled={isSaving}
              />
              <div className={styles.stackedButtons}>
                <Button fullWidth onClick={handleKeepNewMilestone} disabled={isSaving}>
                  Keep milestone entry
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={saveDraft}
                  disabled={isSaving}
                >
                  Save draft
                </Button>
              </div>
            </div>
          </div>
        )}

        {milestones.map((m) => {
          if (milestoneToRemove && milestoneToRemove.id === m.id) {
            const isLast = milestones.length === 1;
            const otherMilestones = milestones
              .filter((item) => item.id !== m.id)
              .map((item) => item.name)
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={m.id}
                className={styles.confirmCard}
                role="alertdialog"
                aria-labelledby={`remove-milestone-${m.id}`}
              >
                <h2
                  id={`remove-milestone-${m.id}`}
                  className={styles.confirmTitle}
                >
                  Remove {m.name || "this milestone"}?
                </h2>
                <p className={styles.confirmBody}>
                  {isLast
                    ? "You can save a draft without milestones. Publishing will need at least one named milestone with a target date."
                    : `Remove this milestone? ${
                        otherMilestones
                          ? `${otherMilestones} stay unchanged.`
                          : "Other milestones stay unchanged."
                      }`}
                </p>
                <Input
                  label="Milestone name"
                  required
                  value={m.name}
                  disabled
                />
                <div className={styles.confirmStackedButtons}>
                  <Button fullWidth onClick={() => setMilestoneToRemove(null)}>
                    Keep milestone
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => confirmRemoveMilestone(m.id)}
                  >
                    Remove milestone
                  </Button>
                </div>
              </div>
            );
          }

          const hasName = Boolean(m.name?.trim());
          const hasDate = Boolean(m.date?.trim());
          const dateError =
            showValidation && !hasDate
              ? `! Add a target date for ${m.name || "milestone"}.`
              : undefined;
          const nameError =
            showValidation && !hasName
              ? "! Add a milestone name."
              : undefined;

          return (
            <div key={m.id} className={styles.milestoneCard}>
              <h3 className={styles.milestoneTitle}>
                {m.name?.trim() ? m.name : "New milestone"}
              </h3>

              <div>
                <Input
                  id={`milestone-name-${m.id}`}
                  label="Milestone name"
                  required
                  placeholder="e.g. Requirements"
                  value={m.name}
                  onChange={(e) =>
                    updateMilestone(m.id, "name", e.target.value)
                  }
                  error={nameError}
                  disabled={isSaving}
                />
                {isSaving && (
                  <p className={styles.lockedText}>
                    Temporarily locked while saving.
                  </p>
                )}
              </div>

              <div>
                <Input
                  id={`milestone-date-${m.id}`}
                  label="Target date"
                  required
                  type="date"
                  value={m.date}
                  onChange={(e) =>
                    updateMilestone(m.id, "date", e.target.value)
                  }
                  error={dateError}
                  disabled={isSaving}
                />
                {isSaving && (
                  <p className={styles.lockedText}>
                    Temporarily locked while saving.
                  </p>
                )}
              </div>

              <button
                type="button"
                className={styles.removeLinkCentered}
                onClick={() => setMilestoneToRemove(m)}
                disabled={isSaving}
              >
                Review milestone removal
              </button>
            </div>
          );
        })}

        {milestones.length > 0 && isAddingMilestone && (
          <div className={styles.milestoneCard}>
            <h3 className={styles.newMilestoneTitle}>Add milestone</h3>
            <Input
              id="new-milestone-name"
              label="Milestone name"
              required
              placeholder="e.g. Working prototype"
              value={newMilestone.name}
              onChange={(e) => {
                setNewMilestone((prev) => ({ ...prev, name: e.target.value }));
                setSaveStatus("idle");
              }}
              error={
                newMilestoneError && !newMilestone.name.trim()
                  ? "! Add a milestone name."
                  : undefined
              }
              disabled={isSaving}
            />
            <Input
              id="new-milestone-date"
              label="Target date"
              required
              type="date"
              value={newMilestone.date}
              onChange={(e) => {
                setNewMilestone((prev) => ({ ...prev, date: e.target.value }));
                setSaveStatus("idle");
              }}
              error={
                newMilestoneError && !newMilestone.date.trim()
                  ? "! Add a target date."
                  : undefined
              }
              disabled={isSaving}
            />
            <div className={styles.newMilestoneActions}>
              <Button onClick={handleKeepNewMilestone} disabled={isSaving}>
                Keep milestone entry
              </Button>
              <button
                type="button"
                className={styles.removeLinkCentered}
                onClick={() => {
                  setIsAddingMilestone(false);
                  setNewMilestone({ name: "", date: "" });
                  setNewMilestoneError(false);
                }}
                disabled={isSaving}
              >
                Review removal
              </button>
            </div>
          </div>
        )}

        {milestones.length > 0 && !isAddingMilestone && (
          <div className={styles.addMilestoneSection}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsAddingMilestone(true)}
              disabled={isSaving}
            >
              Add milestone
            </Button>
          </div>
        )}
      </div>

      <p className={styles.saveNote}>
        Back and Continue keep local entries; Save draft saves them.
      </p>
      <div className={styles.actions}>
        <Button fullWidth onClick={handleContinue} disabled={isSaving}>
          Continue to review
        </Button>
        <div className={styles.projectActionsRow}>
          {saveStatus === "saved" ? (
            <AltLink to="/projects">My Projects</AltLink>
          ) : (
            <button
              type="button"
              className={styles.backLink}
              onClick={goBack}
              disabled={isSaving}
            >
              Back
            </button>
          )}
          <Button
            variant="secondary"
            fullWidth
            onClick={saveDraft}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving draft..."
              : saveStatus === "failed"
                ? "Retry Save draft"
                : "Save draft"}
          </Button>
        </div>
      </div>
      <p className={styles.actionNote}>
        Save draft is available even with incomplete fields.
      </p>
    </section>
  );
}

export default MilestonesStep;
