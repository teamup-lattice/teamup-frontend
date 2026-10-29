import { useContext } from "react";
import Alert from "../../components/Alert";
import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import { formatDate } from "./formatDate";
import { WizardContext } from "./WizardContextValue";
import styles from "./ReviewStep.module.css";

const defaultExpectations = [
  "Respond within the agreed response window.",
  "Keep task status up to date.",
  "Tell the team early when unavailable or a deadline is at risk.",
  "Raise blockers early so the team can help.",
];

function formatOpenRolesCount(count) {
  const words = [
    "no",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  const word = words[count] ?? String(count);
  return `${word} open role${count === 1 ? "" : "s"}`;
}

function formatHours(rawHours) {
  if (!rawHours && rawHours !== 0) return "0";
  const cleaned = String(rawHours).replace(/\s*(hours|hour|h)\b/gi, "").trim();
  return cleaned || String(rawHours);
}

function ReviewStep() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("ReviewStep must be used within a WizardProvider.");
  }

  const {
    basics,
    roles,
    commitment,
    milestones,
    draftId,
    saveStatus,
    saveDraft,
    publishStatus,
    publishProject,
    setCurrentStep,
    goBack,
    ownerName = "You",
  } = context;

  const isPublishing = publishStatus === "publishing";
  const isSaving = saveStatus === "saving";
  const isFailed = publishStatus === "failed";

  // Check blockers
  const isBasicsComplete = Boolean(
    basics.name?.trim() &&
      basics.problem?.trim() &&
      basics.description?.trim() &&
      basics.projectType?.trim() &&
      basics.skills?.length > 0 &&
      basics.outcome?.trim(),
  );

  const hasRole = Boolean(
    roles.roles?.length > 0 &&
      roles.roles.every(
        (r) => r.title?.trim() && r.responsibilities?.trim() && r.skills?.length > 0,
      ),
  );

  const hasDuration = Boolean(commitment.duration?.trim());

  const hasRoleHours = Boolean(
    roles.roles?.length > 0 &&
      roles.roles.every((r) => {
        const hours = commitment.hoursByRole?.[r.id];
        return (
          hours !== undefined &&
          hours !== null &&
          String(hours).trim() !== ""
        );
      }),
  );

  const hasDatedMilestone = Boolean(
    milestones?.length > 0 &&
      milestones.some((m) => m.name?.trim() && m.date?.trim()),
  );

  const missingItems = [];
  if (!isBasicsComplete) missingItems.push("Project basics");
  if (!hasRole) missingItems.push("Role");
  if (!hasDuration) missingItems.push("Duration");
  if (!hasRoleHours) missingItems.push("Role hours");
  if (!hasDatedMilestone) missingItems.push("Dated milestone");

  const hasBlockers = missingItems.length > 0;

  const openRoles = roles.roles?.filter((r) => !r.isOwner) ?? [];

  const teamSizeNum = parseInt(roles.teamSize, 10) || roles.roles.length || 1;
  const peopleWord = teamSizeNum === 1 ? "1 person" : `${teamSizeNum} people`;

  return (
    <section className={styles.card} aria-labelledby="review-heading">
      <span className={styles.badge}>
        {draftId ? "Draft" : "New · unsaved"}
      </span>
      <h1 id="review-heading" className={styles.heading}>
        Review and publish
      </h1>
      <p className={styles.description}>Review your project before publishing.</p>
      <p className={styles.lastSavedLine}>
        Last saved status: Draft · {saveStatus === "saved" ? "all changes saved." : "local edits are not saved yet."}
      </p>

      {/* Alerts */}
      {isPublishing && (
        <Alert variant="info" title="Validating and publishing...">
          Publishing. Not yet confirmed; do not resubmit. Your entries are retained.
        </Alert>
      )}

      {isFailed && (
        <Alert variant="error" title="Project did not publish">
          Publication failed. Saved Draft unchanged; local entries retained.
        </Alert>
      )}

      {!isPublishing && !isFailed && hasBlockers && (
        <Alert
          variant="error"
          title={`${missingItems.length} item${
            missingItems.length === 1 ? "" : "s"
          } needed to publish`}
        >
          Add {missingItems.join(", ")}. You can still save this draft.
        </Alert>
      )}

      {!isPublishing && !isFailed && !hasBlockers && (
        <Alert variant="success" title="Ready to publish">
          Required details complete. Publishing opens recruitment; it does not form or start a team.
        </Alert>
      )}

      {saveStatus === "saving" && (
        <Alert variant="info" title="Saving draft...">
          Saving. Your entries are retained; save not yet confirmed.
        </Alert>
      )}
      {saveStatus === "saved" && (
        <Alert variant="success" title="Draft saved">
          {basics.name || "Your project"} is saved and resumable from My Projects.
        </Alert>
      )}
      {saveStatus === "failed" && (
        <Alert variant="error" title="Draft did not save">
          Save failed. Local entries retained; no saved draft yet.
        </Alert>
      )}

      <div className={styles.cards}>
        {/* Card 1: Project Basics */}
        {!isBasicsComplete ? (
          <div className={styles.blockerCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.blockerTitle}>Project basics</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(1)}
                disabled={isPublishing}
              >
                Edit basics
              </button>
            </div>
            <p className={styles.blockerText}>Project basics are not complete.</p>
          </div>
        ) : (
          <article className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Project basics</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(1)}
                disabled={isPublishing}
              >
                Edit basics
              </button>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Project name</span>
              <p className={styles.itemValue}>{basics.name}</p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Problem or opportunity</span>
              <p className={styles.itemValue}>{basics.problem}</p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Description</span>
              <p className={styles.itemValue}>{basics.description}</p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Project type</span>
              <p className={styles.itemValue}>
                {basics.projectType === "web-application"
                  ? "Web application"
                  : basics.projectType}
              </p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Required project skills</span>
              <p className={styles.itemValue}>{basics.skills.join(" · ")}</p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Expected outcome</span>
              <p className={styles.itemValue}>{basics.outcome}</p>
            </div>
          </article>
        )}

        {/* Card 2: Team and roles */}
        {!hasRole ? (
          <div className={styles.blockerCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.blockerTitle}>Role</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(2)}
                disabled={isPublishing}
              >
                Edit roles
              </button>
            </div>
            <p className={styles.blockerText}>No defined role.</p>
          </div>
        ) : (
          <article className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Team and roles</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(2)}
                disabled={isPublishing}
              >
                Edit roles
              </button>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Team size</span>
              <p className={styles.itemValue}>
                {peopleWord} · {ownerName}
                {openRoles.length > 0
                  ? ` and ${formatOpenRolesCount(openRoles.length)}`
                  : ""}
              </p>
            </div>
            {roles.roles.map((role) => (
              <div key={role.id} className={styles.roleEntry}>
                <div className={styles.roleEntryHeader}>
                  <strong className={styles.itemValue}>{role.title}</strong>
                  <span className={styles.roleBadge}>
                    {role.isOwner ? `${ownerName} · Owner` : "Open role"}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Responsibilities</span>
                  <p className={styles.itemValue}>{role.responsibilities}</p>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Required skills</span>
                  <p className={styles.itemValue}>{role.skills?.join(" · ")}</p>
                </div>
              </div>
            ))}
          </article>
        )}

        {/* Card 3: Commitment summary */}
        {!hasDuration || !hasRoleHours ? (
          <div className={styles.blockerCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.blockerTitle}>
                {!hasDuration ? "Duration" : "Role hours"}
              </h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(3)}
                disabled={isPublishing}
              >
                Edit commitment
              </button>
            </div>
            <p className={styles.blockerText}>
              {!hasDuration
                ? "Project duration is not entered."
                : "Time commitment per role is not entered."}
            </p>
          </div>
        ) : (
          <article className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Commitment summary</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(3)}
                disabled={isPublishing}
              >
                Edit commitment
              </button>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Duration</span>
              <p className={styles.itemValue}>{commitment.duration}</p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Planned dates</span>
              <p className={styles.itemValue}>
                {formatDate(commitment.startDate)} – {formatDate(commitment.endDate)}
              </p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Hours per role</span>
              {roles.roles.map((role) => (
                <p key={role.id} className={styles.itemValue}>
                  {role.title}: {formatHours(commitment.hoursByRole?.[role.id])} h / week
                </p>
              ))}
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>Availability expectations</span>
              <p className={styles.itemValue}>{commitment.availability}</p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>
                Availability and response expectation
              </span>
              <p className={styles.itemValue}>
                {commitment.responseExpectation}
              </p>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.itemLabel}>
                Default working expectations
              </span>
              <ul className={styles.expectationsList}>
                {defaultExpectations.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            </div>
          </article>
        )}

        {/* Card 4: Planned milestones */}
        {!hasDatedMilestone ? (
          <div className={styles.blockerCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.blockerTitle}>Dated milestone</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(4)}
                disabled={isPublishing}
              >
                Edit milestones
              </button>
            </div>
            <p className={styles.blockerText}>
              No named milestone with a target date.
            </p>
          </div>
        ) : (
          <article className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Planned milestones</h2>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setCurrentStep(4)}
                disabled={isPublishing}
              >
                Edit milestones
              </button>
            </div>
            {milestones.map((m) => (
              <p key={m.id} className={styles.itemValue}>
                {m.name} · {formatDate(m.date)}
              </p>
            ))}
          </article>
        )}
      </div>

      <p className={styles.publishNote}>
        Your project remains Draft until publication is confirmed.
      </p>

      {isFailed ? (
        <div className={styles.failedActions}>
          <Button
            variant="secondary"
            fullWidth
            onClick={publishProject}
            disabled={isPublishing}
          >
            Retry Publish project
          </Button>
          <div className={styles.projectActionsRow}>
            <AltLink to="/projects">Return to My Projects</AltLink>
            <Button
              variant="secondary"
              fullWidth
              onClick={saveDraft}
              disabled={isSaving || isPublishing}
            >
              Save draft
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Button
            fullWidth
            onClick={publishProject}
            disabled={hasBlockers || isPublishing}
          >
            {isPublishing ? "Publishing..." : "Publish project"}
          </Button>
          <div className={styles.projectActionsRow}>
            {saveStatus === "saved" ? (
              <AltLink to="/projects">My Projects</AltLink>
            ) : (
              <button
                type="button"
                className={styles.backLink}
                onClick={goBack}
                disabled={isPublishing}
              >
                Back
              </button>
            )}
            <Button
              variant="secondary"
              fullWidth
              onClick={saveDraft}
              disabled={isSaving || isPublishing}
            >
              {isSaving
                ? "Saving draft..."
                : saveStatus === "failed"
                  ? "Retry Save draft"
                  : "Save draft"}
            </Button>
          </div>
        </div>
      )}

      {isPublishing ? (
        <p className={styles.lockedNotice}>
          Back and edits are temporarily locked during submission.
        </p>
      ) : (
        <p className={styles.actionNote}>
          Save draft is available even with incomplete fields.
        </p>
      )}
    </section>
  );
}

export default ReviewStep;
