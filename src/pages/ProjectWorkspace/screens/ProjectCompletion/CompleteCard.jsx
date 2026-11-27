import { useEffect, useRef } from "react";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import { CheckIcon, CircleIcon } from "../../../../components/Icons";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import { APOS, VISIBILITY, confirmationsLine, listText } from "./completionHelpers";
import styles from "./ProjectCompletion.module.css";

// Owner-only "Before you complete" card. Completion needs a saved outcome,
// at least one saved deliverable and every member peer-confirmed.
//   status  "idle" | "completing" | "error"
//   blocked true while evidence is saving or has unsaved local edits
function CompleteCard({
  readiness,
  confirmations,
  ownerName,
  status,
  blocked,
  dirty,
  onComplete,
  onViewPending,
}) {
  const errorRef = useRef(null);
  const completing = status === "completing";
  const hasError = status === "error";

  useEffect(() => {
    if (hasError && errorRef.current) errorRef.current.focus();
  }, [hasError]);

  const pendingNames = readiness.pending.map((item) => item.member);
  const firstPending = readiness.pending[0];

  const pendingText = readiness.pending
    .map((item) => `${item.member}${APOS}s contribution needs ${item.awaiting}${APOS}s confirmation`)
    .join("; ");

  const errorBlock = hasError && (
    <div ref={errorRef} tabIndex={-1} className={shared.errorWrap}>
      <Alert variant="error" title="Project did not complete">
        No completion was submitted. Project still In Progress. Your saved evidence is unchanged.
      </Alert>
    </div>
  );

  if (readiness.eligible) {
    return (
      <section className={shared.card} aria-labelledby="complete-title">
        <h3 id="complete-title" className={shared.cardTitle}>
          Before you complete
        </h3>
        {errorBlock}
        <ul className={styles.checks}>
          <li className={styles.checkDone}>
            <span className={styles.checkIcon} aria-hidden="true">
              <CheckIcon />
            </span>
            Outcome saved
          </li>
          <li className={styles.checkDone}>
            <span className={styles.checkIcon} aria-hidden="true">
              <CheckIcon />
            </span>
            1 deliverable saved
          </li>
        </ul>
        <p className={shared.small}>{confirmationsLine(confirmations)}</p>
        {dirty && (
          <p className={shared.helper} role="status">
            Save or cancel your unsaved changes before completing.
          </p>
        )}
        <div className={shared.stack}>
          <Button
            fullWidth
            onClick={onComplete}
            loading={completing}
            loadingText="Completing project..."
            disabled={blocked}
          >
            {hasError ? "Retry completion" : "Complete project"}
          </Button>
        </div>
        <p className={styles.completeHelper}>
          Still In Progress until completion succeeds. The resulting page stays {VISIBILITY}.
        </p>
      </section>
    );
  }

  return (
    <section className={shared.card} aria-labelledby="complete-title">
      <h3 id="complete-title" className={shared.cardTitle}>
        Before you complete
      </h3>
      <ul className={styles.checks}>
        <li className={readiness.hasOutcome ? styles.checkDone : styles.checkPending}>
          <span className={styles.checkIcon} aria-hidden="true">
            {readiness.hasOutcome ? <CheckIcon /> : <CircleIcon />}
          </span>
          Saved final outcome
        </li>
        <li className={readiness.hasDeliverable ? styles.checkDone : styles.checkPending}>
          <span className={styles.checkIcon} aria-hidden="true">
            {readiness.hasDeliverable ? <CheckIcon /> : <CircleIcon />}
          </span>
          At least one saved project deliverable
        </li>
      </ul>
      {pendingText && (
        <p className={shared.text}>
          Pending {SEP} {pendingText}.
        </p>
      )}
      <div className={shared.stack}>
        {firstPending && (
          <Button variant="secondary" fullWidth onClick={() => onViewPending(firstPending.user?.id || firstPending.userId || firstPending.member)}>
            {pendingNames.length === 1
              ? `View ${firstPending.member}${APOS}s contribution`
              : `View ${listText(pendingNames)} contributions`}
          </Button>
        )}
        <Button fullWidth disabled>
          Complete project
        </Button>
      </div>
      <p className={styles.completeHelper}>
        Only Owner {ownerName} can complete after all members are peer-confirmed. Page remains{" "}
        {VISIBILITY.toLowerCase()}; profiles unchanged.
      </p>
    </section>
  );
}

export default CompleteCard;
