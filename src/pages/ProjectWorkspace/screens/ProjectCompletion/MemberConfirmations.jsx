import Button from "../../../../components/Button";
import { SEP } from "../../workspaceFormat";
import shared from "../shared.module.css";
import { APOS } from "./completionHelpers";
import styles from "./ProjectCompletion.module.css";

// One card per member: their saved contribution wording and whether a
// teammate has peer-confirmed it. Confirmation is of wording only.
function MemberConfirmations({ confirmations, onViewContribution }) {
  const confirmed = confirmations.filter((item) => item.confirmedBy).length;

  return (
    <section aria-labelledby="confirmations-title" className={styles.column}>
      <h3 id="confirmations-title" className={styles.sectionHeading}>
        Member confirmations{SEP}
        {confirmed}/{confirmations.length}
      </h3>

      {confirmations.map((item) => {
        const isConfirmed = Boolean(item.confirmedBy);
        return (
          <article key={item.member} className={shared.card}>
            <p className={styles.member}>
              <span className={shared.avatar} aria-hidden="true">
                {item.member.charAt(0)}
              </span>
              <span>
                {item.member}
                {SEP}
                {item.role}
              </span>
            </p>
            <p className={styles.summary}>{item.summary}</p>
            <p className={shared.text}>
              {item.doneTasks} Done tasks{SEP}saved task ownership and history unchanged.
            </p>

            {isConfirmed ? (
              <div className={`${styles.noteBox} ${styles.noteBoxDone}`}>
                <p className={`${styles.noteTitle} ${styles.noteTitleDone}`}>
                  <span className={styles.tick} aria-hidden="true">
                    {"✓"}
                  </span>
                  Confirmed by {item.confirmedBy}
                </p>
                <p className={styles.noteText}>
                  Teammate confirmation of contribution wording; not a verified impact claim.
                </p>
              </div>
            ) : (
              <div className={styles.noteBox}>
                <p className={styles.noteTitle}>Awaiting {item.awaiting}</p>
                <p className={styles.noteText}>
                  Own review and teammate confirmation are separate.
                </p>
              </div>
            )}

            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => onViewContribution(item.member)}
                aria-label={`View ${item.member}${APOS}s contribution`}
              >
                View contribution
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default MemberConfirmations;
