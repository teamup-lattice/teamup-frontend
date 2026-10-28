import AltLink from "../../components/AltLink";
import Button from "../../components/Button";
import styles from "./NeedsAttentionCard.module.css";

function NeedsAttentionCard({ needsAttention }) {
  return (
    <article className={styles.card}>
      <div className={styles.statuses}>
        {needsAttention.status.map((status) => {
          const isBlocked = status === "Blocked";

          return (
            <span
              className={`${styles.status} ${
                isBlocked ? styles.blocked : styles.overdue
              }`}
              key={status}
            >
              {isBlocked && (
                <span className={styles.blockedIcon} aria-hidden="true">
                  !
                </span>
              )}
              {status}
            </span>
          );
        })}
      </div>

      <h3 className={styles.title}>{needsAttention.title}</h3>

      <div className={styles.owner}>
        <span className={styles.avatar} aria-hidden="true">
          {needsAttention.owner.charAt(0).toUpperCase()}
        </span>
        <span>{needsAttention.owner}</span>
      </div>

      <p className={styles.due}>{needsAttention.due}</p>
      {needsAttention.blockerNote && (
        <p className={styles.blocker}>
          Blocker note: {needsAttention.blockerNote}
        </p>
      )}

      <Button variant="secondary" fullWidth>
        Open task details
      </Button>

      <div className={styles.links}>
        <AltLink to="/projects">Request new date</AltLink>
        <AltLink to="/projects">Hand over</AltLink>
      </div>
    </article>
  );
}

export default NeedsAttentionCard;
