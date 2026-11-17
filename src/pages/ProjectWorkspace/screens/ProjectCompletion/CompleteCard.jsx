import { useEffect, useRef } from "react";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
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
        <p className={shared.text}>
          {"✓"} Outcome saved {"·"} {"✓"} 1 deliverable saved
        </p>
        <p className={shared.text}>{confirmationsLine(confirmations)}</p>
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
        <p className={shared.helper}>
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
        <li className={readiness.hasOutcome ? "" : styles.checkPending}>
          {readiness.hasOutcome ? "✓" : "○"} Saved final outcome
        </li>
        <li className={readiness.hasDeliverable ? "" : styles.checkPending}>
          {readiness.hasDeliverable ? "✓" : "○"} At least one saved project deliverable
        </li>
      </ul>
      {pendingText && (
        <p className={shared.text}>
          Pending {"·"} {pendingText}.
        </p>
      )}
      <div className={shared.stack}>
        {firstPending && (
          <Button variant="secondary" fullWidth onClick={() => onViewPending(firstPending.member)}>
            {pendingNames.length === 1
              ? `View ${firstPending.member}${APOS}s contribution`
              : `View ${listText(pendingNames)} contributions`}
          </Button>
        )}
        <Button fullWidth disabled>
          Complete project
        </Button>
      </div>
      <p className={shared.helper}>
        Only Owner {ownerName} can complete after all members are peer-confirmed. Page remains{" "}
        {VISIBILITY.toLowerCase()}; profiles unchanged.
      </p>
    </section>
  );
}

export default CompleteCard;
