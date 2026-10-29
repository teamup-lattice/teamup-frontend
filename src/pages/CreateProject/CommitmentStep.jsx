import { useContext, useState } from "react";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { WizardContext } from "./WizardContextValue";
import styles from "./CommitmentStep.module.css";

const defaultExpectations = [
  "Respond within the agreed response window.",
  "Keep task status up to date.",
  "Tell the team early when unavailable or a deadline is at risk.",
  "Raise blockers early so the team can help.",
];

function CommitmentStep() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("CommitmentStep must be used within a WizardProvider.");
  }

  const {
    commitment,
    setCommitment,
    roles,
    draftId,
    saveStatus,
    saveDraft,
    goNext,
    goBack,
    markStepIncomplete,
    ownerName = "You",
  } = context;

  const [showValidation, setShowValidation] = useState(false);
  const isSaving = saveStatus === "saving";

  const updateField = (field, value) => {
    setCommitment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateRoleHours = (roleId, hours) => {
    setCommitment((prev) => ({
      ...prev,
      hoursByRole: {
        ...(prev.hoursByRole || {}),
        [roleId]: hours,
      },
    }));
  };

  // Validation checks
  const isDurationValid = Boolean(commitment.duration?.trim());
  const isStartDateValid = Boolean(commitment.startDate?.trim());
  const isEndDateValid = Boolean(commitment.endDate?.trim());
  const isAvailabilityValid = Boolean(commitment.availability?.trim());
  const isResponseValid = Boolean(commitment.responseExpectation?.trim());

  const rolesMissingHours = roles.roles.filter((role) => {
    const hours = commitment.hoursByRole?.[role.id];
    return hours === undefined || hours === null || String(hours).trim() === "";
  });

  const isValid =
    isDurationValid &&
    isStartDateValid &&
    isEndDateValid &&
    rolesMissingHours.length === 0 &&
    isAvailabilityValid &&
    isResponseValid;

  const handleContinue = () => {
    setShowValidation(true);
    if (!isValid) {
      markStepIncomplete(3);
      if (!isDurationValid) {
        document.getElementById("project-duration")?.focus();
      } else if (!isStartDateValid) {
        document.getElementById("project-startDate")?.focus();
      } else if (!isEndDateValid) {
        document.getElementById("project-endDate")?.focus();
      } else if (rolesMissingHours.length > 0) {
        document.getElementById(`role-hours-${rolesMissingHours[0].id}`)?.focus();
      } else if (!isAvailabilityValid) {
        document.getElementById("project-availability")?.focus();
      } else if (!isResponseValid) {
        document.getElementById("project-responseExpectation")?.focus();
      }
      return;
    }

    goNext();
  };

  // Build validation alert
  let validationAlert = null;
  if (showValidation && !isValid) {
    if (!isDurationValid) {
      validationAlert = (
        <Alert variant="error" title="Add project duration">
          <>
            Enter the duration for this project.
            <br />
            <a
              className={styles.focusLink}
              href="#project-duration"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("project-duration")?.focus();
              }}
            >
              Go to duration
            </a>
          </>
        </Alert>
      );
    } else if (!isStartDateValid) {
      validationAlert = (
        <Alert variant="error" title="Add planned start date">
          <>
            Enter the planned start date.
            <br />
            <a
              className={styles.focusLink}
              href="#project-startDate"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("project-startDate")?.focus();
              }}
            >
              Go to planned start date
            </a>
          </>
        </Alert>
      );
    } else if (!isEndDateValid) {
      validationAlert = (
        <Alert variant="error" title="Add planned end date">
          <>
            Enter the planned end date.
            <br />
            <a
              className={styles.focusLink}
              href="#project-endDate"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("project-endDate")?.focus();
              }}
            >
              Go to planned end date
            </a>
          </>
        </Alert>
      );
    } else if (rolesMissingHours.length > 0) {
      const targetRole = rolesMissingHours[0];
      const roleName = targetRole.title || "Role";
      validationAlert = (
        <Alert variant="error" title="Weekly hours are missing">
          <>
            Enter a weekly time commitment for {roleName}. Other values are kept.
            <br />
            <a
              className={styles.focusLink}
              href={`#role-hours-${targetRole.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`role-hours-${targetRole.id}`)?.focus();
              }}
            >
              Go to {roleName} weekly hours
            </a>
          </>
        </Alert>
      );
    } else if (!isAvailabilityValid) {
      validationAlert = (
        <Alert variant="error" title="Add availability expectations">
          <>
            Enter availability expectations for your team.
            <br />
            <a
              className={styles.focusLink}
              href="#project-availability"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("project-availability")?.focus();
              }}
            >
              Go to availability expectations
            </a>
          </>
        </Alert>
      );
    } else if (!isResponseValid) {
      validationAlert = (
        <Alert variant="error" title="Add response expectation">
          <>
            Enter availability and response expectations.
            <br />
            <a
              className={styles.focusLink}
              href="#project-responseExpectation"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("project-responseExpectation")?.focus();
              }}
            >
              Go to availability and response expectation
            </a>
          </>
        </Alert>
      );
    }
  }

  return (
    <section className={styles.card} aria-labelledby="commitment-heading">
      <span className={styles.badge}>
        {draftId ? "Draft" : "New · unsaved"}
      </span>
      <h1 id="commitment-heading" className={styles.heading}>
        Commitment expectations
      </h1>
      <p className={styles.description}>
        Set time commitments and team expectations.
      </p>
      <p className={styles.localChanges}>
        {saveStatus === "saved"
          ? "All changes saved."
          : "Local changes · not saved yet."}
      </p>

      {validationAlert}

      {saveStatus === "saving" && (
        <Alert variant="info" title="Saving commitment...">
          Saving commitment. Entries retained; save temporarily locked.
        </Alert>
      )}
      {saveStatus === "saved" && (
        <Alert variant="success" title="Draft saved">
          Your commitment expectations are saved. Resume from My Projects.
        </Alert>
      )}
      {saveStatus === "failed" && (
        <Alert variant="error" title="Draft did not save">
          Save failed. Saved draft unchanged; local entries retained. Retry.
        </Alert>
      )}

      <div className={styles.fields}>
        <div>
          <Input
            id="project-duration"
            label="Duration"
            required
            placeholder="e.g. 6 weeks"
            value={commitment.duration}
            onChange={(e) => updateField("duration", e.target.value)}
            error={
              showValidation && !isDurationValid
                ? "! Add duration."
                : undefined
            }
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
            id="project-startDate"
            label="Planned start date"
            required
            type="date"
            value={commitment.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            error={
              showValidation && !isStartDateValid
                ? "! Add planned start date."
                : undefined
            }
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
            id="project-endDate"
            label="Planned end date"
            required
            type="date"
            min={commitment.startDate || undefined}
            value={commitment.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            error={
              showValidation && !isEndDateValid
                ? "! Add planned end date."
                : undefined
            }
            disabled={isSaving}
          />
          {isSaving && (
            <p className={styles.lockedText}>
              Temporarily locked while saving.
            </p>
          )}
        </div>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Time for each role</h2>
          <p className={styles.sectionSubtitle}>
            Set weekly hours for each role.
          </p>
        </div>

        <div className={styles.roleCards}>
          {roles.roles.map((role) => {
            const isOwner = role.isOwner;
            const hoursValue = commitment.hoursByRole?.[role.id] ?? "";
            const isHoursMissing =
              hoursValue === undefined ||
              hoursValue === null ||
              String(hoursValue).trim() === "";
            const hoursError =
              showValidation && isHoursMissing
                ? "! Enter weekly hours for this role."
                : undefined;

            return (
              <div key={role.id} className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <h3 className={styles.roleName}>{role.title || "Untitled role"}</h3>
                  <span className={styles.roleBadge}>
                    {isOwner ? `${ownerName} · Owner` : "Open role"}
                  </span>
                </div>
                <p className={styles.roleResponsibilities}>
                  {role.responsibilities || "No responsibilities provided."}
                </p>
                <div>
                  <Input
                    id={`role-hours-${role.id}`}
                    label="Time commitment · hours per week"
                    required
                    placeholder="Not entered"
                    value={hoursValue}
                    onChange={(e) => updateRoleHours(role.id, e.target.value)}
                    error={hoursError}
                    disabled={isSaving}
                  />
                  {isSaving && (
                    <p className={styles.lockedText}>
                      Temporarily locked while saving.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <Input
            id="project-availability"
            label="Availability expectations"
            required
            placeholder="e.g. Weekday evenings; Saturday afternoon"
            value={commitment.availability}
            onChange={(e) => updateField("availability", e.target.value)}
            error={
              showValidation && !isAvailabilityValid
                ? "! Add availability expectations."
                : undefined
            }
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
            id="project-responseExpectation"
            label="Availability and response expectation"
            required
            multiline
            placeholder="e.g. Agree a response window before starting. Suggested: weekday evenings."
            value={commitment.responseExpectation}
            onChange={(e) =>
              updateField("responseExpectation", e.target.value)
            }
            error={
              showValidation && !isResponseValid
                ? "! Add availability and response expectation."
                : undefined
            }
            disabled={isSaving}
          />
          {isSaving && (
            <p className={styles.lockedText}>
              Temporarily locked while saving.
            </p>
          )}
        </div>

        <div className={styles.expectationsCard}>
          <h3 className={styles.expectationsTitle}>
            Default working expectations
          </h3>
          <ul className={styles.expectationsList}>
            {defaultExpectations.map((exp, index) => (
              <li key={index}>{exp}</li>
            ))}
          </ul>
          <p className={styles.expectationsNote}>
            Use these defaults to start a team conversation.
          </p>
        </div>
      </div>

      <p className={styles.saveNote}>
        Back and Continue keep local entries; Save draft saves them.
      </p>
      <div className={styles.actions}>
        <Button fullWidth onClick={handleContinue} disabled={isSaving}>
          Continue to milestones
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

export default CommitmentStep;
